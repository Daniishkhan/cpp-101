# cpp-101: C++ for inference engineering, from games

In 30 weeks (Nov 2026 to Jun 2027: 26 challenge weeks and four buffers, 25 to 30 planned hours a week)
this repository goes from printing to the terminal to a quantised C++ inference engine for a small
Llama-architecture language model (SmolLM2-135M) with your own int8 calibration tooling and hand-written
CUDA kernels, and then to reading llama.cpp fluently. Terminal games are the vehicle for the first half; the second half swaps
the game for a model while keeping the same code shapes. Every challenge names its **inference twin**
(a grid is a tensor, a game loop is a decode loop, an N-squared collision check is attention), every
week ends with something runnable plus a benchmark number, and every line of challenge code is
hand-written by the learner: Claude explains, generates specs and tests, and reviews finished code, but
never writes the solution (see [CLAUDE.md](CLAUDE.md)).

> **This is a learning repo until the week-13 capstone.** Early code is a beginner's code on purpose.
> Judge the trajectory, the tests and the benchmark trail.

## Where things are

| | |
|---|---|
| [goal.md](goal.md) | The curriculum spine: thesis, toolchain, the six phases, the concept index |
| [docs/setup.md](docs/setup.md) | Environment report for this machine and the setup guide |
| [docs/methodology.md](docs/methodology.md) | How a week runs (daily blocks, spec ritual, review protocol) |
| [CONCEPTS.md](CONCEPTS.md) | The concept graph: every concept, where it is introduced, where it is reused |
| [CLAUDE.md](CLAUDE.md) | The tutor rules Claude follows in this repo |
| [docs/book/week1/index.html](docs/book/week1/index.html) | **The Week 1 book**: C++ from zero to Life, 16 chapters |
| [phase1-terminal/01-life/README.md](phase1-terminal/01-life/README.md) | The first challenge, weeks 1 and 2: Game of Life |
| [docs/tutor.md](docs/tutor.md) | The AI tutor inside the book: setup (API key or Claude Code), costs, guardrails |
| [docs/log/](docs/log/) | Weekly logs |
| [common/](common/README.md) | Tiny shared headers, grown only after two challenges needed them |
| [tools/](tools/) | `new-challenge.sh`, `install-hooks.sh`, `run.sh`, `book-check.py`, `ci-challenges.sh` (what CI runs) |
| [.github/workflows/](.github/workflows/) | CI: every challenge (macOS, Debug with sanitizers and Release), the tooling tests, and the book check when the book changes |

### Reading the book

**Online:** [daniishkhan.github.io/cpp-101](https://daniishkhan.github.io/cpp-101/), published from `main`
whenever the book changes and its check passes. The online copy has no tutor (see below).

On your own machine the book is plain HTML with no build step. Either open the file directly:

```sh
open docs/book/week1/index.html
```

or serve it, which is the only way to get the AI tutor (progress tracking and the sidebar work in every
mode):

```sh
python3 tools/serve-book.py
# then visit http://localhost:8765
```

## Quick start: build and test the Life challenge

```sh
cd phase1-terminal/01-life
cmake -S . -B build -G Ninja          # configure (Debug + sanitizers by default)
cmake --build build                   # build life, life_tests, life_bench
./build/life_tests                    # 12 of 13 test cases fail on day one; that is the starting line
```

Then read [the challenge README](phase1-terminal/01-life/README.md) and start at
[chapter 0 of the book](docs/book/week1/00-start-here.html).

## Phases

Dates and gates are in [goal.md](goal.md); weeks run Monday to Sunday with Sunday off, and four buffer
weeks (7, 14, 21, 26) absorb slips.

| Phase | Weeks | Dates | You build | Inference twin | Gate | Status |
|---|---|---|---|---|---|---|
| 1 Terminal games | 1 to 5 | 9 Nov to 13 Dec 2026 | Game of Life (two weeks), Snake, Tetris, roguelike slice | Flat tensors and strides, decode loop, matrix rotation, top-k/top-p sampling | Four games, tests green, BENCH.md numbers, CI green, write-up | **Weeks 1 and 2 in progress** (from 9 Nov 2026) |
| 2 Memory and performance | 6 to 10 | 14 Dec 2026 to 17 Jan 2027 | Particles, Boids, numbers (Q8_0, Q4_0, affine int8 with calibration), paged entity store | Weight layout, attention N-squared, block and per-channel quantisation, PagedAttention | 100k particles at 60 fps; quantiser with measured error | not started |
| 3 Parallelism | 11 to 14 | 18 Jan to 14 Feb 2027 | Job system, NEON kernels and roofline suite, capstone falling-sand game | llama.cpp thread pool, ggml dot kernels, roofline model | Capstone released with CI and arm64 build; roofline chart | not started |
| 4 The pivot | 15 to 21 | 15 Feb to 4 Apr 2027 | Tensor library, op library with conformance table, SmolLM2-135M forward pass, generation, Q8_0 inference, static int8 with calibration | This is inference | Coherent text on the Mac and as an arm64 Linux binary; tokens/s and perplexity for fp32, Q8_0, W8A8; calibration report. **Applications open 1 Apr 2027** | not started |
| 5 GPU and backends | 22 to 26 | 5 Apr to 9 May 2027 | Life and reductions on GPU, tiled matmul, fused attention and quantised matvec, backends: cpu, cuda, simulated accelerator | ggml-cuda, flash attention idea, ggml-backend and graph splitting | Model runs on your CUDA kernels and on the simulated device; matmul at 50 to 70% of cuBLAS | not started |
| 6 llama.cpp | 27 to 30 | 10 May to 6 Jun 2027 | Annotated reading of ggml, llama.cpp, vLLM, ONNX Runtime's int8 path; one PR or tool; write-ups | All of it | PR link or tool release; three write-ups | not started |

## Benchmarks

Numbers are the evidence trail. Each challenge keeps its own `BENCH.md` with the machine, the date and
the build type; this table collects the headline number from each.

| Week | Challenge | Headline number | Source |
|---|---|---|---|
| 1 | Game of Life, 1000x1000 grid, one step | *not yet measured* | [phase1-terminal/01-life/BENCH.md](phase1-terminal/01-life/BENCH.md) |

## Layout

```
README.md            the map (this file)
CLAUDE.md            tutor rules: explain, generate, review; never solve
CONCEPTS.md          concept graph
goal.md              curriculum spine
docs/                setup, methodology, weekly log, write-ups, the book
common/              tiny shared headers you grow yourself
phase1-terminal/     01-life, 02-snake, 03-tetris, 04-roguelike
phase2-memory/       weeks 6 to 10
phase3-parallel/     weeks 11 to 14
phase4-tensor/       weeks 15 to 21
phase5-cuda/         weeks 22 to 26
phase6-llamacpp/     weeks 27 to 30
third_party/         vendored single-header libraries (doctest)
tools/               scripts
```

Toolchain, decided once: C++23, clang, CMake + Ninja, doctest, sanitizers on in Debug, clang-format +
clang-tidy via a pre-commit hook. Details and reasons in [goal.md](goal.md).
