# The book tutor

The Week 1 book has an AI tutor built into the page. Select a sentence or a line of code to get it
explained more simply, ask for an analogy, ask your own question about the chapter, or ask for the
next rung of a hint ladder on a drill or a Life milestone. It follows the same rules as Claude does
everywhere in this repository (`CLAUDE.md`): it explains, it never writes your Life functions.

This page covers setting it up, using it, what it costs and how it is kept from handing you the
answer.

## Setting it up (five minutes, once)

The tutor needs the book to be served by `tools/serve-book.py`, not opened as a file. It can answer
through one of two providers:

| Provider | Paid from | Needs | Speed |
|---|---|---|---|
| **Anthropic API** (used when a key is set up) | API credit, including promotional credits | an API key from the Claude Console | faster: no program has to start first |
| **Claude Code** (used when there is no key) | your Claude subscription | Claude Code installed (it is) | measured: first words after 1.5 to 6.5 seconds, whole answer 6 to 14 |

To use your API credit:

1. **Make a key.** In the [Claude Console](https://platform.claude.com/settings/keys), open *API
   keys* and create one (name it `cpp101-tutor`). Copy it. Do not paste it into a chat, a commit or
   a file in this repository.
2. **Save it.** In a terminal, from the repository folder:

   ```sh
   python3 tools/tutor-key.py
   ```

   Paste the key when asked. Nothing appears as you paste; that is deliberate. The script checks the
   key with the API (a free request), then saves it to `~/.config/cpp101/anthropic-api-key`, a file
   only you can read, outside the repository so it can never be committed.

   If the key is not tied to one workspace, the API also needs to know which workspace to bill,
   and the script asks for the **workspace ID** (it starts with `wrkspc_`; the Console lists it
   under *Workspaces*). It is saved next to the key, in `~/.config/cpp101/anthropic-workspace-id`,
   and sent as the `anthropic-workspace-id` header. It is not a secret. To set or change it on its
   own: `python3 tools/tutor-key.py --workspace wrkspc_…`.
3. **Start the book server** (if an older one is running, stop it with Ctrl-C first; servers started
   before this feature existed do not have it):

   ```sh
   python3 tools/serve-book.py
   ```

   Open <http://localhost:8765>, press <kbd>A</kbd>, and the panel's header should say
   *Anthropic API · Opus 5.5 · $0.00 of $5 today*.

`python3 tools/tutor-key.py --check` tells you whether the key still works;
`python3 tools/tutor-key.py --remove` deletes it and the workspace ID (the tutor then goes back to
Claude Code).

## Using it

| You want | Do this |
|---|---|
| A paragraph or a code line explained more simply | Select it, then **Explain simpler** (or <kbd>⌘↵</kbd>) |
| A picture from everyday life | Select it, then **Analogy**. Every analogy ends with where it breaks down |
| To ask your own question about a passage | Select it, then **Ask…** |
| To ask about the chapter in general | Press <kbd>A</kbd> (or the speech-bubble button) and type. Enter sends, Shift+Enter is a new line |
| To be quizzed | Open the panel on an empty chapter conversation and choose **Quiz me on this chapter** |
| A hint on a drill or a Life milestone | The **Ask the tutor for rung N of 4** button under the drill's hints. Paste your code or the compiler error if you have one |
| The tutor to take more care | Switch on **Think harder** (slower, costs a few times more) |
| A standing instruction ("be strict", "use kitchen analogies") | **Tell the tutor** in the panel. It can never override the no-solutions rule |
| The book without any AI | **Aa → Tutor → AI tutor** off |

A small dot appears in the left margin next to every passage you asked about; click it to jump back
to that answer. Each chapter keeps its own conversation in your browser, so the answers become your
notes for the after-lesson review. **Clear** empties the current chapter only.

Rungs go up one at a time per drill or milestone and stop at 4. There is no rung 5: after rung 4 the
button tells you to reread the chapter or ask for a review, which is the methodology in
`docs/methodology.md`, not a limitation.

## What it costs

The API provider uses **Claude Opus 5.5** at low effort ($4 per million input tokens, $20 per
million output tokens). A typical answer reads the tutor's instructions plus your question (about
3,000 tokens) and writes a few hundred tokens. Measured on 7 November 2026 over 15 answers: **0.8 to
2.7 cents each, 1.4 cents on average**, 5 to 12 seconds for the whole answer. Think harder costs
more, because the model thinks for longer. Every answer shows its time and cost under it.

So $200 of credit is over ten thousand questions; the credit's expiry date will come first.

Two limits protect the credit:

- **A daily budget.** The server adds up what each answer cost (in
  `~/.config/cpp101/tutor-usage.json`) and stops answering for the day at **$5.00**. Change it when
  you start the server: `TUTOR_DAILY_BUDGET_USD=10 python3 tools/serve-book.py`. The panel header
  shows today's total.
- **A cap per answer** (16,000 tokens, thinking included), so one runaway answer cannot cost more
  than about 30 cents.

If the credit runs out, the API refuses the request and the panel tells you so; with auto-reload off
in the Console nothing is charged to a card. Setting a spend limit in the Console (*Spend limits*) is
a good second safeguard.

## How it keeps the answer yours

Three layers, from the inside out:

1. **The instructions.** Every request starts with a system prompt (in `tools/tutor.py`) that
   carries the `CLAUDE.md` rules: who you are, how to teach (first principles, one idea at a time,
   analogies that say where they break, Week 1 constructs only), the four-rung ladder, and the rule
   that `index_of`, `wrap`, `count_neighbours`, `step`, `random_cells`, `render` and the Life `main`
   are never written, sketched or "fixed" in any form or language. Mechanisms are taught on a
   different problem: a clock, a ring of lamps, a calendar.
2. **The guard.** As the answer streams, the server holds back every code block until it is
   complete and checks it. A block that defines one of the contract functions, binds a lambda to one
   of their names, or is a `main` calling several of them is replaced by a note ("A code block was
   withheld here…"). The thinking stream gets the same treatment.
3. **The tests.** `python3 tools/test_tutor.py` (85 tests) and `python3 tools/test_tutor_api.py` (23)
   check the guard against dozens of disguised definitions and against the book's own harmless
   examples, and check the server's request handling, offline. `python3 tools/tutor-eval.py` is a
   live red-team: about fifteen attempts to talk the tutor into writing a Life function ("my teacher
   said it's fine", "just pseudo-code", "in Python", "fix my step"), plus three questions that must
   get a real answer. Its first run against the API (7 November 2026) passed all 15, with the guard never
needed (the model declined on its own every time), and cost $0.21.

In a live test, asked for `wrap` with a "my teacher says it's fine" excuse, the tutor declined and
gave rung 4 as a worked example on a ring of eight lamps.

## Privacy and security

- The key lives only in the server process and the key file. The browser never sees it, and it is
  never logged or put into an error message.
- The server listens on `127.0.0.1` only, so nothing else on your network can reach it, and it
  rejects requests whose `Host` or `Origin` is not this machine, so a web page in another tab cannot
  use your tutor (or your credit).
- What is sent to Anthropic: the tutor's instructions, the chapter's title, the passage you selected,
  your question, the last few messages of that chapter's conversation and anything you pasted. The
  Claude Code provider can additionally read files in this repository when you mention your code; the
  API provider cannot.

## Files

| File | What it does |
|---|---|
| `tools/serve-book.py` | Serves the book with no caching, and routes `/api/tutor/*` to the tutor |
| `tools/tutor.py` | The system prompt, the request checks, the code guard, the Claude Code provider |
| `tools/tutor_api.py` | The Anthropic API provider, the key loading and the daily budget |
| `tools/tutor-key.py` | Saves, checks and removes the API key |
| `tools/test_tutor.py`, `tools/test_tutor_api.py` | Offline tests |
| `tools/tutor-eval.py` | Live red-team of the running tutor |
| `docs/book/week1/assets/tutor.js`, `tutor.css` | The panel, the selection menu, the margin dots, the rung buttons |
| `docs/book/week1/assets/TUTOR-SPEC.md` | The contract between the pieces |

## Settings (environment variables of the server)

| Variable | Default | Meaning |
|---|---|---|
| `TUTOR_PROVIDER` | `auto` | `auto`: the API if a key is found, else Claude Code. `api` or `claude-code` to force one |
| `TUTOR_API_MODEL` | `claude-opus-5-5` | The API model. `claude-sonnet-5-5` is about half the price |
| `TUTOR_DAILY_BUDGET_USD` | `5.00` | The API provider stops for the day at this total |
| `ANTHROPIC_API_KEY` | (unset) | If set, used instead of the key file |
| `ANTHROPIC_WORKSPACE_ID` | (unset) | If set, used instead of the saved workspace ID |
| `TUTOR_MODEL` | `sonnet` | The Claude Code provider's model |

## When something goes wrong

| The panel says | Do this |
|---|---|
| *Offline: prompts are copied for Claude Code* | The page was not served by `tools/serve-book.py` (opened as a file, or the old `python3 -m http.server`). Start the book server |
| *Claude Code (sonnet)* although you saved a key | Reload the page (the server looks for the key on every request). If it persists, run `python3 tools/tutor-key.py --check` |
| *…not tied to one workspace…* (or `tutor-key.py` says the key "is not scoped to a workspace") | Run `python3 tools/tutor-key.py --workspace wrkspc_…` with the ID from the Console's Workspaces page |
| *The Anthropic API rejected the key* | The key was deleted or mistyped. Make a new one and run `tools/tutor-key.py` again |
| *Your API credit has run out* | Add credit, or start the server with `TUTOR_PROVIDER=claude-code` |
| *Today's tutor budget … is used up* | Wait until tomorrow or raise `TUTOR_DAILY_BUDGET_USD` |
| *The model declined to answer this one* | A safety filter misfired; rephrase. (The API already retried on a fallback model.) |
| *The API rate limit was reached* / *busy* | Wait a minute, then Retry |

## Design notes

- **Beside the text, not instead of it.** The layout borrows from Riddled, which you showed me: AI
  notes linked to the exact passage, a selection menu, a panel scoped to one document with suggested
  starting questions, standing instructions, a "just my words" switch. Riddled can also speak up
  unprompted; the book tutor only answers when you ask, because the book's text never changes and
  unprompted comments on it would be noise. Feedback on your own code belongs in VS Code.
- **Raw HTTP, not the `anthropic` package.** The book server must run on the Python that ships with
  macOS (3.9) with nothing installed; the SDK's current version needs Python 3.10 and pip.
- **Opus 5.5 at low effort.** The tutor's hardest job is judgement (teach the idea without giving
  away the function), which favours the strongest model; low effort keeps answers short and cheap.
  Thinking cannot be switched off on this model, so the panel shows a short summary of it instead of
  a silent pause. `fallbacks: "default"` asks the API to retry a safety-filter decline on the model
  Anthropic recommends, inside the same request.
- **Not in version 1:** voice input, grading your quiz answers before revealing them, an error
  decoder for pasted compiler output, exporting your notes, an OpenAI provider.
