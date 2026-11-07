#!/usr/bin/env python3
"""Offline tests for tools/tutor_api.py (the Anthropic API provider of the book tutor).

A fake Messages API runs on 127.0.0.1 and plays back canned server-sent events, so nothing here
touches the network or spends money. Run: python3 tools/test_tutor_api.py
"""
import http.server
import json
import os
import sys
import tempfile
import threading
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

FAKE = {'status': 200, 'events': [], 'error_body': b'', 'requests': []}


class FakeAPI(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        n = int(self.headers.get('content-length', 0))
        FAKE['requests'].append({'path': self.path, 'headers': dict(self.headers),
                                 'body': json.loads(self.rfile.read(n))})
        if FAKE['status'] != 200:
            self.send_response(FAKE['status'])
            self.send_header('content-type', 'application/json')
            self.end_headers()
            self.wfile.write(FAKE['error_body'])
            return
        self.send_response(200)
        self.send_header('content-type', 'text/event-stream')
        self.end_headers()
        for ev in FAKE['events']:
            self.wfile.write(f"event: {ev['type']}\ndata: {json.dumps(ev)}\n\n".encode())
            self.wfile.flush()


SERVER = http.server.ThreadingHTTPServer(('127.0.0.1', 0), FakeAPI)
threading.Thread(target=SERVER.serve_forever, daemon=True).start()
CONFIG = tempfile.mkdtemp(prefix='cpp101-tutor-test-')
os.environ['TUTOR_API_BASE'] = f'http://127.0.0.1:{SERVER.server_address[1]}'
os.environ['TUTOR_CONFIG_DIR'] = CONFIG
os.environ.pop('ANTHROPIC_API_KEY', None)
os.environ.pop('TUTOR_PROVIDER', None)
os.environ.pop('TUTOR_API_MODEL', None)

import tutor  # noqa: E402
import tutor_api  # noqa: E402

KEY = 'sk-ant-test-0000000000000000'
REQ = {'kind': 'chat', 'prompt': "I'm reading chapter 07. What is a stride?", 'history': [],
       'think': False, 'chapter': '07-flat-grid.html', 'tell': ''}


def text_events(*chunks, stop='end_turn', model='claude-opus-5-5', thinking=()):
    evs = [{'type': 'message_start', 'message': {'model': model, 'usage': {
        'input_tokens': 1000, 'cache_creation_input_tokens': 2000, 'cache_read_input_tokens': 0,
        'output_tokens': 1}}}]
    i = 0
    if thinking:
        evs.append({'type': 'content_block_start', 'index': i, 'content_block': {'type': 'thinking'}})
        for t in thinking:
            evs.append({'type': 'content_block_delta', 'index': i,
                        'delta': {'type': 'thinking_delta', 'thinking': t}})
        evs.append({'type': 'content_block_stop', 'index': i})
        i += 1
    evs.append({'type': 'content_block_start', 'index': i, 'content_block': {'type': 'text', 'text': ''}})
    for c in chunks:
        evs.append({'type': 'content_block_delta', 'index': i, 'delta': {'type': 'text_delta', 'text': c}})
    evs.append({'type': 'content_block_stop', 'index': i})
    evs.append({'type': 'message_delta', 'delta': {'stop_reason': stop}, 'usage': {'output_tokens': 500}})
    evs.append({'type': 'message_stop'})
    return evs


def run(req=REQ):
    out = []
    tutor_api.stream_answer(dict(req), lambda e, d: out.append((e, d)))
    return out


def joined(out):
    return ''.join(d['text'] for e, d in out if e == 'text')


class Base(unittest.TestCase):
    def setUp(self):
        FAKE.update(status=200, events=[], error_body=b'', requests=[])
        for name in ('anthropic-api-key', 'tutor-usage.json', 'anthropic-workspace-id'):
            try:
                os.remove(os.path.join(CONFIG, name))
            except FileNotFoundError:
                pass
        os.environ.pop('ANTHROPIC_API_KEY', None)
        os.environ.pop('TUTOR_PROVIDER', None)
        os.environ.pop('TUTOR_DAILY_BUDGET_USD', None)
        os.environ.pop('ANTHROPIC_WORKSPACE_ID', None)

    def write_key(self, mode=0o600, text=KEY):
        with open(tutor_api.KEY_FILE, 'w') as f:
            f.write(text + '\n')
        os.chmod(tutor_api.KEY_FILE, mode)


class KeyAndProvider(Base):
    def test_no_key_means_claude_code(self):
        self.assertIsNone(tutor_api.load_key()[0])
        self.assertEqual(tutor_api.wanted(), 'claude')

    def test_key_file_switches_auto_to_the_api(self):
        self.write_key()
        self.assertEqual(tutor_api.load_key()[0], KEY)
        self.assertEqual(tutor_api.wanted(), 'anthropic')
        self.assertEqual(tutor.public_status()['provider'], 'anthropic')

    def test_environment_variable_wins(self):
        self.write_key(text='sk-ant-from-file')
        os.environ['ANTHROPIC_API_KEY'] = KEY
        key, where = tutor_api.load_key()
        self.assertEqual(key, KEY)
        self.assertIn('ANTHROPIC_API_KEY', where)

    def test_readable_by_others_is_refused(self):
        self.write_key(mode=0o644)
        key, why = tutor_api.load_key()
        self.assertIsNone(key)
        self.assertIn('chmod 600', why)

    def test_empty_file_is_refused(self):
        self.write_key(text='')
        self.assertIsNone(tutor_api.load_key()[0])

    def test_provider_override(self):
        self.write_key()
        os.environ['TUTOR_PROVIDER'] = 'claude-code'
        self.assertEqual(tutor_api.wanted(), 'claude')
        os.environ['TUTOR_PROVIDER'] = 'api'
        self.assertEqual(tutor_api.wanted(), 'anthropic')

    def test_status_never_contains_the_key(self):
        os.environ['ANTHROPIC_API_KEY'] = KEY
        self.assertNotIn(KEY, json.dumps(tutor.public_status()))


class Body(Base):
    def test_request_body(self):
        b = tutor_api.build_body(REQ)
        self.assertEqual(b['model'], 'claude-opus-5-5')
        self.assertTrue(b['stream'])
        self.assertEqual(b['fallbacks'], 'default')
        self.assertEqual(b['thinking'], {'type': 'adaptive', 'display': 'summarized'})
        self.assertEqual(b['output_config'], {'effort': 'low'})
        self.assertEqual(tutor_api.build_body({**REQ, 'think': True})['output_config'], {'effort': 'high'})
        self.assertEqual(b['system'][0]['cache_control'], {'type': 'ephemeral'})
        self.assertIn('count_neighbours', b['system'][0]['text'])    # the never-solve rules
        self.assertEqual(b['messages'], [{'role': 'user', 'content': tutor.build_user_turn([], REQ['prompt'])}])
        self.assertNotIn('temperature', b)

    def test_model_override(self):
        os.environ['TUTOR_API_MODEL'] = 'claude-sonnet-5-5'
        try:
            self.assertEqual(tutor_api.build_body(REQ)['model'], 'claude-sonnet-5-5')
        finally:
            os.environ.pop('TUTOR_API_MODEL')

    def test_cost(self):
        usage = {'input_tokens': 1000, 'output_tokens': 500, 'cache_creation_input_tokens': 2000,
                 'cache_read_input_tokens': 4000}
        # 1000*4 + 500*20 + 2000*5 + 4000*0.2 = 24800 per million
        self.assertAlmostEqual(tutor_api.cost_of('claude-opus-5-5', usage), 0.0248)
        self.assertIsNone(tutor_api.cost_of('some-future-model', usage))


class Streaming(Base):
    def test_success(self):
        self.write_key()
        FAKE['events'] = text_events('A stride is ', 'how far you jump.', thinking=('Plan: ', 'short.'))
        out = run()
        names = [e for e, _ in out]
        self.assertEqual(names[0], 'meta')
        self.assertEqual(out[0][1], {'provider': 'anthropic', 'model': 'claude-opus-5-5'})
        self.assertIn('thinking', names)
        self.assertEqual(joined(out), 'A stride is how far you jump.')
        self.assertEqual(names[-1], 'done')
        done = out[-1][1]
        # 1000*4 + 2000*5 + 500*20 = 24000 per million
        self.assertAlmostEqual(done['cost_usd'], 0.024)
        self.assertAlmostEqual(done['spent_today_usd'], 0.024)
        self.assertAlmostEqual(tutor_api.spent_today(), 0.024)
        r = FAKE['requests'][0]
        self.assertEqual(r['path'], '/v1/messages')
        self.assertEqual(r['headers'].get('x-api-key'), KEY)
        self.assertEqual(r['headers'].get('anthropic-version'), tutor_api.API_VERSION)
        self.assertEqual(r['headers'].get('anthropic-beta'), 'server-side-fallback-2026-07-01')

    def test_routed_through_tutor_stream_answer(self):
        self.write_key()
        FAKE['events'] = text_events('Hello.')
        out = []
        tutor.stream_answer(dict(REQ), lambda e, d: out.append((e, d)))
        self.assertEqual(out[0][1]['provider'], 'anthropic')
        self.assertEqual(joined(out), 'Hello.')

    def test_guard_withholds_a_life_function(self):
        self.write_key()
        code = '```cpp\nint wrap(int v, int n) {\n    return (v % n + n) % n;\n}\n```\n'
        FAKE['events'] = text_events('Here:\n\n', code[:17], code[17:], 'Done.')
        out = run()
        self.assertIn('withheld', [e for e, _ in out])
        self.assertNotIn('% n + n', joined(out))
        self.assertIn('withheld', joined(out))
        self.assertEqual(out[-1][0], 'done')

    def test_refusal(self):
        self.write_key()
        FAKE['events'] = text_events('Par', stop='refusal')
        out = run()
        self.assertEqual(out[-1][0], 'error')
        self.assertIn('declined', out[-1][1]['message'])

    def test_fallback_model_is_reported(self):
        self.write_key()
        FAKE['events'] = text_events('Hi.', model='claude-opus-5')
        out = run()
        self.assertEqual(out[-1][1].get('served_by'), 'claude-opus-5')

    def test_bad_key(self):
        self.write_key()
        FAKE['status'] = 401
        FAKE['error_body'] = json.dumps({'type': 'error', 'error': {
            'type': 'authentication_error', 'message': 'invalid x-api-key'}}).encode()
        out = run()
        self.assertEqual(out[-1][0], 'error')
        self.assertIn('rejected the key', out[-1][1]['message'])
        self.assertNotIn(KEY, json.dumps(out))

    def test_credit_exhausted(self):
        self.write_key()
        FAKE['status'] = 400
        FAKE['error_body'] = json.dumps({'type': 'error', 'error': {
            'type': 'invalid_request_error',
            'message': 'Your credit balance is too low to access the Anthropic API.'}}).encode()
        out = run()
        self.assertIn('credit has run out', out[-1][1]['message'])

    def test_daily_budget_stops_before_calling(self):
        self.write_key()
        os.environ['TUTOR_DAILY_BUDGET_USD'] = '0.01'
        tutor_api.add_spend(0.02)
        out = run()
        self.assertEqual(out[-1][0], 'error')
        self.assertIn('budget', out[-1][1]['message'])
        self.assertEqual(FAKE['requests'], [])

    def test_no_key(self):
        out = run()
        self.assertEqual(out[-1][0], 'error')
        self.assertEqual(FAKE['requests'], [])


class Workspace(Base):
    WS = 'wrkspc_01TESTtestTEST0000'

    def test_no_workspace_no_header(self):
        self.write_key()
        FAKE['events'] = text_events('Hi.')
        run()
        self.assertNotIn('anthropic-workspace-id', {k.lower() for k in FAKE['requests'][0]['headers']})

    def test_workspace_file_adds_the_header(self):
        self.write_key()
        with open(tutor_api.WORKSPACE_FILE, 'w') as f:
            f.write(self.WS + '\n')
        FAKE['events'] = text_events('Hi.')
        out = run()
        self.assertEqual(out[-1][0], 'done')
        h = {k.lower(): v for k, v in FAKE['requests'][0]['headers'].items()}
        self.assertEqual(h.get('anthropic-workspace-id'), self.WS)
        self.assertEqual(tutor_api.status()['workspace'], self.WS)

    def test_environment_workspace_wins_and_junk_is_ignored(self):
        with open(tutor_api.WORKSPACE_FILE, 'w') as f:
            f.write('not a workspace\n')
        self.assertIsNone(tutor_api.load_workspace())
        os.environ['ANTHROPIC_WORKSPACE_ID'] = self.WS
        self.assertEqual(tutor_api.load_workspace(), self.WS)

    def test_unscoped_key_error_explains_the_fix(self):
        self.write_key()
        FAKE['status'] = 400
        FAKE['error_body'] = json.dumps({'type': 'error', 'error': {
            'type': 'invalid_request_error',
            'message': 'This API key is not scoped to a workspace, so this request must include '
                       'the anthropic-workspace-id header with the ID of the workspace to use.'}}).encode()
        out = run()
        self.assertIn('--workspace', out[-1][1]['message'])


if __name__ == '__main__':
    unittest.main(verbosity=1)
