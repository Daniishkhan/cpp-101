# Methodology: how a week runs

> **Draft.** This is the skeleton promised in [goal.md](../goal.md) (section 13). Refine it after the Life
> weeks with what actually happened; keep each change dated at the bottom. Week numbers follow the 7 Nov
> 2026 revision of goal.md: 30 weeks, Monday to Saturday, Sunday off, buffers in weeks 7, 14, 21 and 26.

## The shape of a day (about 5 hours) and of a week (six days)

Five focused hours beat eight scattered ones. Monday to Friday follow the four blocks below. **Saturday is
strand day** (about five hours, cap six: maths 1.5 h, measurement 1.5 h, reading 1 h, write-up 1 h; see
goal.md section 10) and **Sunday is off, every week, buffers included; it is never a slip day.** From
Wed 10 Feb 2027 the Wednesday Read block is interview preparation (90 min); the Code block is untouched.
Planned total 25 to 30 hours; the rest of your 35 is unplanned slack for slips and Friday stretch goals.

| Block | Length | What |
|---|---|---|
| **Read** | 60 to 90 min | The book chapter(s) for today, with every example typed out and run in `scratch/`. Not copied: typed. Check-yourself questions answered before opening the answers |
| **Code** | 120 to 150 min | The milestone of the day, hand-written, red to green. No Claude in this block except for error-message decoding |
| **Review** | 30 min (60 on Friday) | Commit, run the review ritual (below), write down what you got wrong and why. Friday's hour is the review of the whole challenge |
| **Retrieve and log** | 15 to 20 min | Five concepts from [CONCEPTS.md](../CONCEPTS.md) explained out loud; two lines in the weekly log |

Put the Code block where your attention is best. Stop the Code block on time even mid-bug; write the
bug down in the log and come back tomorrow. Bugs you sleep on are faster.

## The 20-minute spec ritual (before any code)

A challenge README is written **before** the week starts, in one 20-minute session with Claude. A spec is
sized for the weekday Code blocks: about 12 hours of typing plus the Read blocks that feed them, not for
35 hours. The ritual also states, in one line, which machine the week's numbers come from.

1. Name the concept and the inference twin in two sentences each.
2. Write the spec: inputs, outputs, defaults, what the user sees. Concrete numbers.
3. Write the contract: the header with declarations and comments, and the list of milestones.
4. Write the acceptance tests in words (Claude turns them into doctest cases afterwards).
5. Name two stretch goals and promise yourself not to start them before the gate is passed.
6. Cite the CONCEPTS.md rows the week introduces and reuses, including its Maths and Model rows.
7. Write the benchmark's Experiment in advance: what you will measure and what you predict.

After the 20 minutes the spec is frozen. You may *reduce* scope later by moving a requirement to
"stretch", in writing, with the date. You may not quietly redefine what "done" means.

## Hand-code first, then review

You write every line in `src/`. Claude's role is set in [CLAUDE.md](../CLAUDE.md): explain, generate
specs and tests, review, ask questions. When you are stuck:

1. Re-read the test that fails and the comment above the function in the header.
2. Reproduce the smallest version of the problem in `scratch/` with `tools/run.sh`.
3. Ask Claude for **one rung** of the hint ladder, and say which rung you are on.
4. Only after the tests are green, ask for a review.

The review ritual, after each milestone or at least daily, and for the whole challenge on Friday: commit
first, then ask Claude for the six-part review in CLAUDE.md (correctness, clarity, idioms, performance
ideas, inference twin, three questions). Write the three questions and your answers into the log. Do not act on review notes before
tomorrow's Code block; let them settle.

## Red, green, commit

Work one test case at a time, in the milestone order the tests give you. Run the tests; read the first
failing message; make only that one pass; run again. Commit at every green milestone with a message
that names it (`M3: wrap and count_neighbours green`). The pre-commit hook formats your code, so each
commit also reads as professional. A week with seven commits that each turn one test green is the
record a reviewer wants to see.

## The weekly log and the write-up

Each week has a log at `docs/log/<ISO week>.md` ([Week 1](log/2026-W46.md), [Week 2](log/2026-W47.md)).
It holds a day-by-day table (planned, done, blocker, hours), the milestone checklist, a Strands checklist
(what Saturday's maths, measurement and reading slots produced, plus the Compiler Explorer paste), the
benchmark number and a link to the write-up. Fill it in during the last block of each day; two honest lines beat a paragraph written
on Sunday.

The write-up is 400 to 800 words, written on Saturday in the write-up slot, in `docs/`. It answers three
questions: what did you build, what surprised you, what would you do differently. Phase gates ask for a
longer one (the Phase 1 gate title is "What a grid taught me about tensors").

## Spaced retrieval from CONCEPTS.md

Memory needs retrieval, not re-reading. Each day's last block: pick five rows from CONCEPTS.md whose
status is `in progress` or `owned` (the Maths and Model areas count as rows like any other), cover the table, and explain each concept out loud in two sentences
with one concrete example. A row you cannot explain is marked `rusty` and goes to the front of
tomorrow's Read block. Once a week, do the same with ten rows from earlier weeks. Rows only move to
`owned` after they have been used in a challenge *and* explained in a review.

## When a week slips

It will. The rule from goal.md: **slip into the buffer rather than skip a gate.** In order:

1. On Wednesday evening, check the milestone list. Behind by more than one milestone? Decide now,
   not on Sunday.
2. First lever: move stretch goals out of the week entirely.
3. Second lever: move one *non-gate* requirement to "stretch", in writing, in the README and the log.
4. Third lever: the overflow goes to the next buffer week (7, 14, 21 or 26). Saturday strands and Sunday
   are never slip days. If a phase has used its buffer before its gate, drop the one low-value item named
   for that phase in goal.md section 3, in writing, dated; at most one drop per phase.
5. Entry checks: each phase opens with a 30-minute cold check (goal.md names the items). Two failed items
   mean the phase starts on Tuesday, with Monday spent on the gaps.
6. Never: paste a solution, weaken a test, skip the benchmark number or the Experiment to "catch up", or
   move the Sun 28 Mar 2027 artefact deadline.

A slipped week with green tests and an honest log is a success. A finished week with pasted code is a
failure that looks like success until the first interview.

## Using reference implementations (from week 15)

nanoGPT, llama2.c, the Hugging Face transformers implementation of SmolLM2 (for reference dumps) and ggml
exist to be *checked against*, not copied from. The rule: read a reference to
understand **what** the output must be (dump a tensor from PyTorch, compare numerically), never to see
**how** to write the loop. Read the reference code only after your own version passes its tests, and
then write down what they did better in `phase6/` notes.

---

*Changelog:* 2026-11-07 first skeleton, before Week 1. 2026-11-07 (later) aligned with the revised goal.md:
six-day week, Saturday strands, buffers instead of calendar shifts, entry checks, Experiment in the spec
ritual, reference implementations from week 15.
