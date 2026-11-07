# C++ for Inference Engineering: Curriculum Spine

**7 November 2026 · Danish** (revised the same day after the first audit; see the [changelog](#14-changelog))

> In 30 weeks (Mon 9 Nov 2026 to Sun 6 Jun 2027: 26 challenge weeks and four buffers, about 25 to 30
> planned hours a week inside the 35 you have, about 800 hours) this curriculum takes you from printing to the terminal to a C++ inference
> engine for a small Llama-architecture language model, running quantised on your Mac's CPU and as an
> arm64 Linux binary, with your own int8 calibration tooling and your own CUDA kernels behind a backend
> abstraction, and then to reading llama.cpp and ggml fluently. Games are the vehicle for the first
> half; the second half swaps the game for a model while keeping the same code shapes. By Thu 1 Apr
> 2027 the repository is an application.

## Contents

1. [Thesis](#1-thesis)
2. [Toolchain, machines and repo layout](#2-toolchain-machines-and-repo-layout)
3. [Phase map, calendar and the shape of a week](#3-phase-map-calendar-and-the-shape-of-a-week)
4. [Phase 1: language core through terminal games (weeks 1 to 5)](#4-phase-1-language-core-through-terminal-games-weeks-1-to-5)
5. [Phase 2: memory and performance (weeks 6 to 10)](#5-phase-2-memory-and-performance-weeks-6-to-10)
6. [Phase 3: parallelism, SIMD and the capstone game (weeks 11 to 14)](#6-phase-3-parallelism-simd-and-the-capstone-game-weeks-11-to-14)
7. [Phase 4: the pivot, tensor library and a small language model in C++ (weeks 15 to 21)](#7-phase-4-the-pivot-tensor-library-and-a-small-language-model-in-c-weeks-15-to-21)
8. [Phase 5: GPU kernels and backends (weeks 22 to 26)](#8-phase-5-gpu-kernels-and-backends-weeks-22-to-26)
9. [Phase 6: llama.cpp, ggml, contribution and the public record (weeks 27 to 30)](#9-phase-6-llamacpp-ggml-contribution-and-the-public-record-weeks-27-to-30)
10. [The strands, and what proficient means](#10-the-strands-and-what-proficient-means)
11. [Concept index (frozen seed; CONCEPTS.md is live)](#11-concept-index-frozen-seed-conceptsmd-is-live)
12. [Evidence trail](#12-evidence-trail)
13. [Open decisions and what the methodology doc covers](#13-open-decisions-and-what-the-methodology-doc-covers)
14. [Changelog](#14-changelog)

---

## 1. Thesis

**The target.** Inference engineering for small open language models deployed privately on edge devices
and CPUs, at the Dutch edge-AI accelerator and semiconductor employers you named: Axelera AI (Eindhoven,
Metis AIPU, Voyager SDK), NXP's edge AI side (eIQ, Neutron NPU, i.MX hosts), Innatera (Rijswijk) and
similar, with Amsterdam GPU-cloud serving teams (Nebius and the like) as a second target. They hire C++
engineers for runtimes, kernels, quantisation and calibration tooling, compilers and model-deployment
SDKs. Int8 and operator coverage matter to them as much as LLM decode, their host CPUs are Arm, and their
interchange formats are ONNX and GGUF. You also want serving literacy: what continuous batching, paged
attention and a scheduler are, read from vLLM, not built.

Five principles shape every week:

1. **Every challenge has an inference twin.** Each project README names the inference concept it is
   secretly teaching (grid = tensor, game loop = decode loop, collision N² = attention N²). You never
   learn C++ "for later"; you learn the mechanics llama.cpp and an edge runtime are built from.
2. **One artefact per week, always runnable.** Each week ends with a program that does something
   visible plus a benchmark number committed to the repo. No half-finished weeks.
3. **Terminal only until the pivot.** No graphics library. Raw ANSI rendering keeps the dependency
   surface tiny and the focus on data and loops, which is where inference lives.
4. **Hand-code first, AI reviews after.** The repo's `CLAUDE.md` enforces your rule: Claude explains,
   generates challenges and reviews finished code; it does not write solutions.
5. **Six strands run under the challenges.** Maths intuition, measurement, model literacy, reading,
   interview preparation and a proficiency rubric each have a fixed slot and a deliverable (section 10).
   None of them ever takes time from the Code block.

**The arc in one line:** terminal games (weeks 1 to 5) → memory and performance (6 to 10) → parallelism
and SIMD with a capstone game (11 to 14) → tensor library and a small language model from scratch, int8
calibration included (15 to 21) → CUDA kernels and a backend abstraction with a simulated accelerator
(22 to 26) → llama.cpp and ggml internals and a contribution (27 to 30).

---

## 2. Toolchain, machines and repo layout

Decide the toolchain once, in week 1, and never revisit it. One correction runs through this section:
you develop on this Mac for all 30 weeks and **add targets**; you never switch machines. A Linux
container on an Apple Silicon Mac is arm64 Linux: no AVX2, no hardware performance counters. Each tool
is placed where it exists; the five-minute checks live in `docs/setup.md`.

| Decision | Choice | Why |
|---|---|---|
| **Standard** | C++23 | `std::span`, concepts, ranges, `<bit>`, `std::expected`, `std::print`, `std::mdspan` (a tensor view); llama.cpp's C++17 is a subset you will recognise |
| **Compiler** | Apple clang 21 on the Mac throughout; LLVM 20 or newer from apt.llvm.org in the container and on CI (`clang++-20 -stdlib=libc++`); nvcc on the GPU pod | Same front end everywhere. The distro's clang 18 libc++ lacks `std::jthread` without `-fexperimental-library` and lacks `hardware_destructive_interference_size` (both week 11); the distro's g++ 13 and 14 lack `<print>` or `<mdspan>` (week 15). Homebrew LLVM 23 is for clang-format, clang-tidy and clangd only |
| **Build** | CMake + Ninja, one `CMakeLists.txt` per challenge | The industry default; llama.cpp and ggml use it |
| **Linux (arm64) parity** | OrbStack Ubuntu 24.04 machine (`orb create ubuntu:noble`) from Mon 14 Dec 2026 | gdb, glibc parity, valgrind with cachegrind (a cache simulator; build for it with `-march=armv8-a`) and an arm64 Linux deployment target, the architecture of edge boards and accelerator hosts. Not AVX2, not perf counters |
| **Profiler and counters** | Instruments via `xcrun xctrace` (Time Profiler, CPU Counters, Allocations, Metal System Trace) from week 6; `samply` for flame graphs | The only supported way to read cycles, IPC and cache misses here. Needs the full Xcode app (only the Command Line Tools are installed on 7 Nov 2026); start the download Sat 28 Nov 2026 |
| **x86 Linux** | Not owned. AVX2 ports proved correct on the free `ubuntu-24.04` GitHub runner are the first week 12 stretch; AVX2 timings and counters are a later week 12 stretch on rented bare metal | A RunPod CPU pod has AVX2 but hides the PMU like the container; only bare metal (a Hetzner auction server, EUR 30 to 70 a month depending on the auction, priced 7 Nov 2026) exposes counters. Check `perf stat -e cycles` in the first five minutes of any rented box |
| **Tests** | doctest, vendored | Zero setup; every challenge ships tests you turn green |
| **Benchmarks** | Hand-written `std::chrono` harness in weeks 1 and 2; Google Benchmark from week 6 | 4 performance and 6 efficiency cores, no thread pinning: request performance cores with the QoS class `QOS_CLASS_USER_INTERACTIVE`, mains power, ten repetitions, report the median and the core class |
| **Debug builds** | `-fsanitize=address,undefined` always; ThreadSanitizer from week 11 | ASan, UBSan and TSan work on arm64 macOS; LeakSanitizer does not (Instruments Allocations, `leaks`, or ASan in the container) |
| **Debugger** | lldb, taught in week 3 (Snake); checkpoints in Buffer A, weeks 11, 17, 22; gdb in the container | Stepping through your own code is the fastest way to understand the stack and the heap |
| **Assembly** | Compiler Explorer, weekly from week 1: AArch64, x86-64 with `-mavx2`, nvcc in Phase 5 | How you check a prediction without a profiler, and read AVX2 output on an Arm laptop |
| **CI** | GitHub Actions from week 1: `macos-26` first; `ubuntu-24.04` and `ubuntu-24.04-arm` by 14 Dec 2026, both with LLVM 20 from apt.llvm.org (`clang++-20 -stdlib=libc++`), the same compiler as the container | Free on a public repo; pin the labels. Claude wrote the workflow (tooling) on 7 Nov 2026: `tools/ci-challenges.sh` builds Debug and Release and runs the tests, so every run builds green and the tests stay red until M4 turns the 13 cases green |
| **Terminal UI** | Raw ANSI throughout; FTXUI optional in the week 13 capstone | A UI library's component model is time the target roles do not reward |
| **Formatting** | clang-format + clang-tidy, pre-commit hook | Reads as professional from the first commit |
| **GPU** | Rented RTX 4090 on RunPod or Vast.ai, weeks 22 to 25, 12 to 15 h a week, 50 to 60 h total; one optional A100/H100 session | Apple Silicon has no CUDA. Rates as estimated on 7 Nov 2026, re-check before booking: 4090 about USD 0.5 to 0.9 an hour, A100 about 1.4 to 1.8, H100 about 2 to 4. Nsight Compute is usually blocked in pods; Nsight Systems works everywhere |
| **Metal (M5)** | Free GPU on the Mac: week 22 stretch, week 28 llama.cpp baseline, week 29 contribution option | Shaders compile from source at runtime with nothing beyond macOS; check the ggml release notes for what the Metal backend does with the M5's GPU before relying on it |
| **Python** | Glue and reading only: Homebrew Python 3.12 or newer in a venv from week 6 (the system 3.9.6 cannot run current PyTorch); reference tensors from PyTorch and ONNX Runtime, token ids from the Hugging Face tokenisers library, plots, the bounded model-literacy slot | A challenge is never solved in Python. The one Python artefact you write is a NumPy forward pass of one transformer block, because its output is a test oracle |

### Where each week runs

| Weeks | Dates | Machine | Only there |
|---|---|---|---|
| 1 to 5 | 9 Nov to 13 Dec 2026 | This Mac; CI on `macos-26` | Apple clang, lldb, ASan/UBSan, ANSI terminal |
| 6 to 10 | 14 Dec 2026 to 17 Jan 2027 | This Mac plus the OrbStack arm64 machine; Linux runners on CI | Instruments counters on the Mac; cachegrind, gdb in the container |
| 11 to 14 | 18 Jan to 14 Feb 2027 | This Mac; AVX2 correctness on CI and rented bare metal only for the week 12 stretches | NEON, TSan, the roofline on the Mac; `perf stat` only on bare metal |
| 15 to 21 | 15 Feb to 4 Apr 2027 | This Mac (a 135M to 500M model in fp32 is 0.5 to 2 GB); the container for the week 17 arm64 binary | Accelerate for the matmul comparison |
| 22 to 26 | 5 Apr to 9 May 2027 | This Mac for editing, Metal and the simulated accelerator; a rented 4090 pod for CUDA | nvcc, cuBLAS, Nsight Systems |
| 27 to 30 | 10 May to 6 Jun 2027 | This Mac (llama.cpp on Metal as the baseline); the container as the edge-Linux check | Metal System Trace |

Every spec ritual states in one line which machine the week's numbers come from.

### Repo layout

```text
cpp-101/
  README.md  CLAUDE.md  CONCEPTS.md      # the map; tutor rules; the live concept graph
  docs/                                 # setup, methodology, log, write-ups, the book, model/, papers/, interviews/
  common/                               # tiny shared headers you grow yourself
  phase1-terminal/ ... phase6-llamacpp/  # one folder per challenge: README, CMakeLists, src, tests, BENCH.md
  tools/                                # new-challenge.sh, bench-all.sh, dump_reference.py, conformance table script
  .github/workflows/                    # CI from week 1, the release workflow from week 13
```

Solutions live on a `solutions` branch you only merge after your own version is green. Each challenge
README is written before you start it (the 20-minute spec ritual) so the spec is fixed; a spec is sized
for the weekday Code blocks, about 12 hours of typing plus the Read blocks that feed them, not for 35.

---

## 3. Phase map, calendar and the shape of a week

Six phases, 30 weeks: 26 challenge weeks and four buffers. Every week is an ISO week, Monday to Sunday;
**week 1 is Mon 9 Nov to Sun 15 Nov 2026** (ISO 2026-W46; 10 Nov is a Tuesday). The Life README and the week logs
(`docs/log/2026-W46.md`, `docs/log/2026-W47.md`) were re-dated and re-milestoned on 7 Nov 2026 (M1 to M4
in week 1, M5 to M7 in week 2), and the change is recorded in the W46 log's Scope changes table. Mon 9 Nov
is a normal book day with a 30-minute re-run of the setup checklist. Each phase ends with a **gate**: a thing that
runs, a number, a write-up. Do not start the next phase until the gate is passed; slip into the buffer
rather than skip a gate.

| Phase | Weeks | Dates | You build | Core C++ | Inference twin | Gate (Saturday) |
|---|---|---|---|---|---|---|
| **1 Terminal games** | 1 to 5 | 9 Nov to 13 Dec 2026 | Game of Life (two weeks), Snake, Tetris, roguelike slice | Values, references, vector, structs/classes, RAII, headers, algorithms, lambdas, lldb | Flat tensors and strides, decode loop, matrix rotation, top-k/top-p sampling | 12 Dec: four games, tests green, BENCH.md numbers, CI green, write-up |
| **2 Memory and performance** | 6 to 10 (Buffer A = 7) | 14 Dec 2026 to 17 Jan 2027 | Particles, Boids, numbers with Q8_0, Q4_0 and an affine int8 quantiser, paged entity store | AoS vs SoA, cache, templates, bit manipulation, float formats, ownership, allocators | Weight layout, attention N², block and per-channel quantisation, PagedAttention | 16 Jan: 100k particles at 60 fps; quantiser with measured error |
| **3 Parallelism** | 11 to 14 (Buffer B = 14) | 18 Jan to 14 Feb 2027 | Job system, NEON kernels plus roofline suite, capstone falling sand | Threads, atomics, false sharing, NEON intrinsics, Instruments counters | llama.cpp thread pool, ggml dot kernels, roofline | 13 Feb: capstone released with CI and arm64 build; roofline chart |
| **4 The pivot** | 15 to 21 (Buffer C = 21) | 15 Feb to 4 Apr 2027 | Tensor library, op library with conformance table, SmolLM2-135M forward pass, generation, Q8_0 inference, static int8 with calibration | Strides and views, blocked matmul, mmap, numerical testing, int8 kernels | This is inference | 3 Apr: coherent text on the Mac and in the arm64 container; tokens/s and perplexity for fp32, Q8_0, W8A8; calibration report |
| **5 GPU and backends** | 22 to 26 (Buffer D = 26) | 5 Apr to 9 May 2027 | Life on GPU with reductions, tiled matmul, fused attention and quantised matvec, backends: cpu, cuda, simulated accelerator | CUDA threads/blocks, shared memory, shuffles, streams, function-table dispatch | ggml-cuda, flash attention idea, ggml-backend and graph splitting | 8 May: model runs on your CUDA kernels and on the simulated device with CPU fallback; matmul at 50 to 70% of cuBLAS |
| **6 llama.cpp** | 27 to 30 | 10 May to 6 Jun 2027 | Annotated reading of ggml, llama.cpp, vLLM, ONNX Runtime's int8 path; a PR or tool; write-ups | Reading large codebases, contribution workflow | All of it | 5 Jun: PR link or tool release; three write-ups |

**The hinge is week 15 (Mon 15 Feb 2027).** Before it the repo looks like game development; after it,
inference engineering. The point is that the code barely changes.

**Applications open Thu 1 Apr 2027.** Everything on the application path lands by Sun 28 Mar (section
12). From Mon 29 Mar the curriculum takes about 25 hours a week; applications and interviews take the
other 10. **June 2027 is float** for interviews and the move to the Netherlands around July: nothing new
is scheduled after Sun 6 Jun, and the end may move to Sun 27 Jun 2027 if Phases 5 and 6 slip.

### The shape of a week

Six working days. **Sunday is off, every week, buffers included, and is never a slip day.** Monday to
Friday follow the methodology's blocks (Read 60 to 90 min, Code 120 to 150, Review 30, Retrieve and log
15 to 20: 3.75 to 4.8 hours), so 19 to 24 hours of challenge work; Friday's Review block is 60 minutes
and holds the review of the whole challenge. **Saturday is strand day**, five hours, cap six: maths
1.5 h, measurement 1.5 h, reading 1 h, write-up 1 h. From Wed 10 Feb 2027 the Wednesday Read block is
interview preparation, fixed at its 90-minute upper bound; the Code block is untouched. Planned total
25 to 30 hours; the remaining 5 to 10 hours of the 35 you have are deliberately unplanned slack for slips
and for stretch goals on Friday, and the 35-hour ceiling is reached only by the Code block running to
150 minutes and a Friday stretch, never by Sunday. The strand hours are funded by the Read block shrinking
once the book is finished and by specs sized for the weekday Code blocks (about 12 hours of typing plus
the Read blocks that feed them). Stretch goals happen on a Friday whose gate was passed by Thursday, or in
a buffer list; never on Saturday.

### Buffer weeks

A buffer first absorbs slip from the weeks before it; the rest goes to its own list, never to starting
the next challenge early. Each "must" list is at most 12 hours; Buffer C's is 16, because applications
open that week. **An unused buffer is a success.**

- **Buffer A, 21 to 27 Dec 2026 (Christmas; plan about half a week).** Must: any open milestone; two
  lldb sessions on a `scratch/` toy (print addresses, watch a vector reallocate, step into a destructor:
  where you meet what a pointer is); the Phase 1 write-up if unpublished. Fri 1 Jan 2027 is also off.
- **Buffer B, 8 to 14 Feb 2027 (Phase 3 gate).** Must: model literacy consolidation, 10 h (one
  transformer block drawn; every tensor shape of one SmolLM2-135M block by hand into
  `docs/model/shapes.md`; the reference model file read line by line; `tools/dump_reference.py`, written
  by Claude as tooling, run against your table; a NumPy forward pass of one SmolLM2 block in `tools/`,
  matched to `dump_reference.py` within 1e-4, which is the oracle the week 16 tests run against); capstone
  overflow capped at two days; the Phase 4 model confirmed at the week 15 spec ritual, Sat 13 Feb. If
  time: roofline polish, README and CI badges, first CV draft, the AVX2 stretch.
- **Buffer C, 29 Mar to 4 Apr 2027 (Phase 4 gate; applications open Thu 1 Apr).** Must (16 h): the gate,
  the Phase 4 write-up and the LinkedIn post, published by Sat 3 Apr; CV and one-page portfolio summary;
  one day (5 h) of C++ interview questions; first applications sent. If time: the repo README as a story
  (first version); the broadcast conformance case and the `tools/` conformance-table script (if the
  script is not done, the gate's table is pasted by hand from the doctest output).
- **Buffer D, 3 to 9 May 2027 (Phase 5 gate).** Gate and write-up.

### Slip rules

The mid-week check is Wednesday evening. A slip is handled by the methodology's two levers (stretch
goals out; one non-gate requirement to stretch, in writing, dated). **Saturday strands and Sunday are
never slip days.** What the levers cannot absorb goes to the next buffer. If a phase has used its buffer
before its gate, drop its one named low-value item rather than move the next phase (stretch goals are
already gone by then, so these are must items): Phase 1 Tetris's hold and ghost piece (rotation and line
clear stay);
Phase 2 the percentile variant of the week 9 calibration experiment (min-max stays); Phase 3 parallel
Boids in the week 11 job system (parallel particles stay); Phase 4 the per-layer plot in the week 20
calibration report (the table stays), then sampling beyond temperature, then the 8-thread column; Phase 5
the Metal fallback (section 8). At most one drop per phase. The Sun 28 Mar 2027 artefact deadline does
not move. Strand deliverables never block a gate; a missing one carries to the next phase's first
Saturday.

---

## 4. Phase 1: language core through terminal games (weeks 1 to 5)

**Goal:** be fluent in the 30% of C++ that 90% of inference code uses, with a visible thing moving on
screen every week. Each game is also a micro-lesson in how a terminal works. Phase 1 has five weeks
because the Week 1 book has 17 chapter files (00 to 16; 01 to 13 reading, 14 the build) at 2,500 to
5,000 words each, every example typed and run: two weeks of Read blocks on its own.

**Strands this phase** (Saturday; definitions in section 10):

| Week | Maths | Measure (experiment; Compiler Explorer paste) | Reading |
|---|---|---|---|
| 1 | none (the book's clock face and flat index) | Debug vs Release at 1000×1000, prediction first; `wrap`: divide vs multiply-and-shift | book |
| 2 | 20 min: Hz, ms per frame, why 60 fps is 16.7 ms | ms per step vs grid size; did the step loop vectorise? | book |
| 3 | 45 min: 10,000 random draws vs the expected count | lldb taught Tue 24 Nov; the direction switch: jump table or compare chain | none |
| 4 | 2×2 matrices as transformations, composition as product (3Blue1Brown linear algebra 1 to 4); the Tetris rotations on paper, checked against the game | table vs computed rotation; a `Vec2` by value travels in registers | none |
| 5 | distributions, inverse-CDF sampling, expected value, temperature, top-k and top-p as truncation plus renormalisation (Seeing Theory 1 to 3); 10,000 loot draws vs the table | sort with a lambda vs a function pointer: inlined? | rubric checkpoint 1, Sat 12 Dec |

### Weeks 1 and 2: Game of Life in the terminal (Mon 9 Nov to Sun 22 Nov 2026)

Toroidal grid, ANSI redraw, configurable size and seed. Week 1: book chapters 0 to 10, milestones M1 to
M4 (all 13 doctest cases green, running the tests from the README's quick-start before you understand
CMake), reviews on M2 and M4. Week 2: chapters 11 to 14 (CMake, doctest, timing, build Life), M5 to M7,
BENCH.md, whole-challenge review Fri 20 Nov, write-up Sat 21 Nov. If the gate is passed by Wed 18 Nov,
the rest of week 2 is the Life stretch list and the Snake spec ritual; Snake code starts Mon 23 Nov.

- **C++ you learn:** compilation model, headers vs sources, `int`/`size_t`/`bool`, `std::vector`, flat
  2D indexing, functions, `const`, references, `std::string`, chrono for frame timing, first CMake and
  doctest, reading a CI run.
- **Inference twin:** a tensor is a flat array plus a shape; the Life step is a 3×3 stencil, the shape
  of every elementwise or conv kernel you will write; double-buffering = ping-pong buffers.
- **Stretch:** a 1000×1000 grid timed from the game itself; patterns; colours by cell age.

### Week 3: Snake (Mon 23 Nov to Sun 29 Nov 2026)

Raw-mode keyboard input, growing body, speed-up, score. The debugger is taught this week: a 75-minute
lldb session on Tue 24 Nov in the Read block, on a `scratch/` toy that walks off a vector (breakpoints,
step over and into, print a vector and a deque, a conditional breakpoint, the backtrace, the week 1 tests
under lldb with AddressSanitizer stopping at the faulting line). One blockers-table entry this week must
name the lldb command that resolved it.

- **C++ you learn:** `struct`, `enum class`, `std::deque`, scope and lifetime, RAII via a raw-terminal
  guard that restores the terminal in its destructor, `switch`, by-reference vs by-value,
  `std::optional` for "no key pressed", lldb.
- **Inference twin:** the game loop is a decode loop: one update per tick with a fixed time budget;
  dropped frames are latency spikes.
- **Stretch:** replay recording to a file (first file I/O).

### Week 4: Tetris (Mon 30 Nov to Sun 6 Dec 2026)

7 pieces, rotation, line clear, hold, ghost piece.

- **C++ you learn:** classes with invariants, constructors/destructors, nested `std::array` vs flat
  arrays, value semantics, copy and move, operator overloading for a tiny `Vec2`, `static`, header-only
  vs compiled.
- **Inference twin:** piece rotation is a multiply by a 2×2 rotation matrix; you write transpose and
  flip, which are tensor ops; bounds checking becomes shape checking. In week 16 the same rotation,
  applied to pairs of dimensions, is rotary position embedding.
- **Stretch:** rotation as a lookup table vs computed: measure both.

### Week 5: Roguelike slice (Mon 7 Dec to Sun 13 Dec 2026)

Procedural dungeon (rooms and corridors), BFS pathfinding monsters, loot tables with weighted random.
De-scoped from the first draft: pointers and smart pointers go to Buffer A and week 10, `std::span` to
week 15, A* and the binary format to stretch.

- **C++ you learn:** iterators, `<algorithm>` (`sort`, `partial_sort`, `accumulate`, `transform`),
  lambdas, `<random>` (`mt19937`, `discrete_distribution`); `std::priority_queue` only for the A* stretch.
- **Inference twin:** weighted loot sampling is token sampling: temperature, top-k and top-p over a
  "logits" array of item scores; week 18 reuses this code. BFS is graph traversal in ggml's compute graph.
- **Stretch:** A* with a bounded open set (beam search); save and load the dungeon as a binary file
  with a header.

> **Gate, Sat 12 Dec 2026:** every game plays from its own binary; every challenge has passing doctests;
> `BENCH.md` for Life and Tetris has numbers with a completed Experiment section; CI green on every
> configured runner; rubric checkpoint 1 dated; write-up "What a grid taught me about tensors".

**Not touched yet:** raw and smart pointers (Buffer A, week 10), inheritance hierarchies, exceptions as
control flow, templates beyond using `std::vector<T>`, threads.

---

## 5. Phase 2: memory and performance (weeks 6 to 10)

**Goal:** the instinct that separates inference engineers from application programmers: knowing where
bytes live, how they move through caches, and what a number costs. Create the OrbStack arm64 machine on
Mon 14 Dec for cachegrind, gdb and Linux parity; counters come from Instruments on the Mac. In the same
session install LLVM 20 from apt.llvm.org in the container and verify that a `std::jthread`, a
`std::mdspan` and a `std::print` test each compile with `clang++-20 -stdlib=libc++`. Install the
Homebrew Python venv (PyTorch, NumPy, safetensors, onnx, tokenisers) the same week. **Entry check** Mon 14 Dec: the
checkpoint 1 result stands in.

**Strands this phase:**

| Week | Maths | Measure | Reading (model literacy) |
|---|---|---|---|
| 6 | velocity, Euler integration, dot product as projection; one particle for three steps by hand | predict the SoA speed-up first; AoS vs SoA loads per particle; first CPU Counters run | ML 1: a layer is a matmul plus a non-linearity (3Blue1Brown NN 1, 2); SmolLM2 and GPT-2 bytes at fp32, int8, 4-bit by hand; Drepper's memory paper, sections 3.1 to 3.3 |
| 7 (A) | pen-and-paper vectors (if time) | the two lldb sessions | ML 2: attention on paper (The Illustrated Transformer; 3Blue1Brown NN 6); one head, 3 tokens, dimension 4, by hand |
| 8 | cosine similarity, N² pairs, big-O as counting; pair counts vs times | N² vs grid at three sizes; a ranges pipeline vs the hand loop | ML 3: tokens, embeddings, logits, the residual stream, in your own words |
| 9 | IEEE 754 fields, ulp, relative error, cancellation, quantisation noise (step² over 12); a block's Q8 error by hand | fp32 vs int8 update; `bit_cast` costs nothing, the clamps do | ML 4: what a KV cache stores; its bytes at 1,024 tokens for SmolLM2 (3 KV heads) and GPT-2 |
| 10 | calibration choices: min-max vs percentile, per-tensor vs per-channel, symmetric vs asymmetric; page and offset as division and remainder | allocation in a loop vs the pool: did the call move out? | Wu et al. (NVIDIA, 2020) on integer quantisation; ggml's `block_q8_0` and `block_q4_0` beside your structs |

### Week 6: Particle system (Mon 14 Dec to Sun 20 Dec 2026)

100k particles with gravity, wind, wall collisions, rendered as braille density with raw ANSI.

- **C++ you learn:** array-of-structs vs struct-of-arrays, cache lines and prefetching, `alignas`,
  Google Benchmark, Instruments CPU Counters (cache misses, IPC) and cachegrind in the container,
  `reserve`, `-O0` vs `-O2` vs `-O3 -march=native`, `std::function`.
- **Inference twin:** weights are laid out for the access pattern, not readability; memory bandwidth,
  not FLOPs, bounds most of inference. You feel this when SoA is 3× faster.
- **Stretch:** hot/cold splitting; measure.

### Week 7: Buffer A (Mon 21 Dec to Sun 27 Dec 2026)

See section 3.

### Week 8: Boids (Mon 28 Dec 2026 to Sun 3 Jan 2027; Fri 1 Jan off)

5k agents with separation, alignment, cohesion.

- **C++ you learn:** templates and concepts (a generic `Grid<T>`), `std::function` vs templates for
  callbacks, N² neighbour search → uniform spatial grid → sorted cell lists, `std::ranges`.
- **Inference twin:** attention is an all-pairs interaction over tokens; spatial hashing is the idea
  behind sliding-window and block-sparse attention: skip pairs that cannot matter.
- **Stretch:** N² vs spatial grid vs k-d tree at 1k/5k/20k agents; plot it.

### Week 9: Numbers (Mon 4 Jan to Sun 10 Jan 2027)

A fixed-point maths library, then quantise particle positions three ways while the game still plays:
Q8_0 and Q4_0 blocks as llama.cpp stores them, and an affine int8 quantiser with a scale and a zero
point, per-tensor and per-channel scales, int8 × int8 accumulated in int32 and requantised with a
fixed-point multiplier and shift (which is what the fixed-point library is for).

- **C++ you learn:** bit manipulation, `<bit>`, `std::bit_cast`, IEEE 754 by hand, fp16 and bf16
  conversion (bf16 to fp32 is a 16-bit shift and takes an hour; fp16 is the Q8_0 block scale, and week 17
  needs both), integer overflow and UB, `constexpr`, unit-testing numerical error, one calibration
  experiment (min-max vs percentile clipping on real particle data).
- **Inference twin:** two kinds of quantisation. llama.cpp quantises weights offline in blocks and
  activations dynamically per block at run time; edge accelerators quantise activations statically from
  calibration data with per-channel weight scales. Scale, zero point, per-channel, calibration method,
  requantise: the vocabulary of the tooling roles you are applying for.
- **Stretch:** Q4_K-style super-blocks.

### Week 10: Paged entity store (Mon 11 Jan to Sun 17 Jan 2027)

Entities allocated from fixed-size pages via a page table; spawn/despawn 10k entities a second with no
fragmentation. Ownership is taught here: you met addresses in Buffer A; now `unique_ptr`, `shared_ptr`
and when to use neither, on the store.

- **C++ you learn:** raw pointers as handles, `unique_ptr` with custom deleters, `shared_ptr`, custom
  allocators, arena/bump allocators, pools, placement `new`, move semantics and the rule of five, RAII at
  scale. `std::pmr` is the first thing to drop.
- **Inference twin:** PagedAttention and the llama.cpp KV cache: a per-sequence array of pages mapped
  through a block table. Your entity store is a KV cache manager with different payloads.
- **Stretch:** copy-on-write page sharing (prefix caching).

> **Gate, Sat 16 Jan 2027:** 100k particles at 60 fps on the Mac, with the history (AoS → SoA → aligned
> → `-march=native`) and the core class in `BENCH.md`; the quantiser passes round-trip tests and
> `BENCH.md` reports mean and max error for Q8_0, Q4_0 and per-channel int8 with the calibration
> experiment; every BENCH.md has an Experiment section; four notes in `docs/model/`; write-up
> "Quantisation is just a loot table for bytes" (or better).

---

## 6. Phase 3: parallelism, SIMD and the capstone game (weeks 11 to 14)

**Goal:** use every core and every vector lane, and know from measurement when it helps. Ends with a
public game: your first portfolio piece. **Entry check** Mon 18 Jan, 30 min, cold: why SoA was faster
in bytes per cache line; the fields of a float you pick; a block's Q8 error by hand; the store's page
arithmetic; dot product as projection. Two failures mean the phase starts on Tuesday.

**Strands this phase:**

| Week | Maths | Measure | Reading |
|---|---|---|---|
| 11 | Amdahl's law; predicted vs measured speed-up at 2, 4, 8, 10 threads | debugger checkpoint: switch threads, read a TSan report; an atomic vs a mutex | the roofline paper (Williams, Waterman, Patterson, 2009), before the suite; Sutter's "The Free Lunch Is Over" (if time) |
| 12 | float addition is not associative; arithmetic intensity, log-log axes, a roofline as two lines; every kernel's intensity by hand | NEON dot vs auto-vectorised scalar; predict peak FLOPs and bandwidth from documents first; the roofline chart is drawn here from Thu and Fri's numbers | NEON intrinsics reference; ggml's dot kernel as text; Apple's CPU optimisation guide for Apple Silicon (if time). Bandwidth predictions: M5 about 153 GB/s, Pi 5 about 17, i.MX 95 about 25 |
| 13 | none | the hottest sand rule: branches per cell | Karpathy's "Let's build GPT" lecture, first hour |
| 14 (B) | matmul as rows dotted with columns; strides; 2mnk flops | the stencil at `-O2` vs `-O3` | lecture, second hour; nanoGPT and SmolLM2's reference code → `docs/model/shapes.md`; the NumPy forward pass of one block (Buffer B must list); rubric checkpoint 2, Sat 13 Feb; interview: first Wednesday session Wed 10 Feb (the repo story, 90 min) and the CV draft |

### Week 11: Job system (Mon 18 Jan to Sun 24 Jan 2027)

A thread pool that updates particles and Boids in parallel chunks; a lock-free-ish work queue.

- **C++ you learn:** `std::thread`, `std::jthread`, `std::mutex`, `condition_variable`, `std::atomic`,
  acquire/release (just enough), false sharing and `hardware_destructive_interference_size`,
  `std::barrier`, ThreadSanitizer.
- **Inference twin:** llama.cpp's compute splits tensor rows across a thread pool with a barrier per op.
- **Stretch:** work stealing; scaling from 1 to 10 threads with both knees explained: at 4 (performance
  cores full) and at 10 (efficiency cores are slower).

### Week 12: SIMD and the roofline (Mon 25 Jan to Sun 31 Jan 2027)

Mon to Wed: vectorise the particle update, a dot product and your Q8 dequant-plus-dot with NEON on the
M5 behind one interface that has a scalar fallback. Thu and Fri: the roofline suite (peak FLOPs and memory
bandwidth; cache bandwidth is stretch) and every kernel so far measured against it, with two rooflines for
the M5, one per core class; the chart itself is drawn in Saturday's measurement slot. The stand-alone
roofline week of the first draft is merged here, and to pay for it the AVX2 ports are the first stretch.

- **C++ you learn:** intrinsics, `#ifdef` dispatch, alignment, horizontal reductions,
  auto-vectorisation reports (`-Rpass=loop-vectorize`), benchmark methodology (warm-up, variance, core
  class), arithmetic intensity, a harness whose CSV does not depend on perf output. Flags: Apple clang
  already enables dotprod and `-march=native` adds i8mm; the container's default is plain armv8-a and
  needs `-march=armv8.2-a+dotprod+i8mm`; x86 needs `-mavx2 -mfma`. `-march=native` means a different
  instruction set on each of your boxes.
- **Inference twin:** ggml's `vec_dot_q8_0` and `vec_dot_q4_0` are this: load a block, dequantise in
  registers, multiply-accumulate. The roofline is how inference engineers decide what to optimise:
  decode is memory-bound, prefill compute-bound, and you see it in your numbers.
- **Stretch (four, in order):** the same three kernels in AVX2 behind the interface, proved correct by
  the `ubuntu-24.04` runner (Fri 29 Jan if the must list is green by Thu 28 Jan, else Buffer B); an int8
  dot with `vdotq_s32` for week 20; cache bandwidth on the roofline; AVX2 timings and an x86 line on the
  chart from 6 to 8 hours on rented bare metal.

### Week 13: Capstone, falling-sand game (Mon 1 Feb to Sun 7 Feb 2027)

Must: sand, water and fire on a 400×200 grid, threaded with the week 11 job system, NEON on the hot
stencil, a release workflow on top of the week 1 CI (tags, binaries for three runners), built and tested
natively in the arm64 container, a README with a grid × threads × fps table and a 10-second GIF.
Stretch (Buffer B if time, else dated and dropped): steam, plants, acid, FTXUI brushes, save and load,
dirty-rectangle updates (the sparse-compute idea).

- **C++ you learn:** architecture of a 2 to 3k-line program, module boundaries, build for Mac and Linux
  arm64, release engineering.
- **Inference twin:** a cellular automaton with data-dependent rules: a stencil kernel with branching,
  the hardest kind to make fast. This is the program you port to CUDA in week 22.

### Week 14: Buffer B (Mon 8 Feb to Sun 14 Feb 2027)

See section 3. Interview preparation starts Wed 10 Feb (Wednesdays, 90 min, section 10).

> **Gate, Sat 13 Feb 2027:** the capstone is public with a release tag, CI green on three runners and an
> arm64 Linux build, and a benchmark section; the roofline chart of your Mac is in `docs/` with each
> kernel on both core classes; `docs/model/shapes.md` exists and the reference dump runs; rubric
> checkpoint 2; write-up "My laptop's roofline, and where my kernels sit on it".

From Sat 13 Feb the repo is presentable: share it, and apply from Thu 1 Apr. A reviewer at an edge-AI
company opens the capstone for its threading, SIMD dispatch, arm64 build and benchmark table, not its
playability.

---

## 7. Phase 4: the pivot, tensor library and a small language model in C++ (weeks 15 to 21)

**Goal:** a working, quantised LLM inference engine written by you, no ML library, running on your Mac
and as an arm64 Linux binary, plus the int8 calibration tooling an edge accelerator team runs. You arrive
with `docs/model/shapes.md` and a working reference dump; the tensor library is tested against them from
day one. **Entry check** Mon 15 Feb (the checkpoint 2 result stands in): the shapes table from memory
for one block; your dot kernel's arithmetic intensity; the roofline as two lines; matmul as rows dotted
with columns with every stride; what a barrier does.

**The model: SmolLM2-135M, Llama architecture** (Apache 2.0; 30 layers, hidden 576, 9 query heads, 3 KV
heads, intermediate 1536, vocabulary 49,152, tied embeddings, RMSNorm, RoPE, SwiGLU; 269 MB of bf16
safetensors, 540 MB in fp32; official GGUF files exist). SmolLM2, Qwen2.5 and Llama 3.2 share this block
structure (Qwen2.5 adds QKV biases, Llama 3.2 a RoPE scaling rule), so the Phase 6 comparison on SmolLM2
is apples to apples and an interviewer asking what GQA buys in KV-cache bytes
meets someone who built it. **The alternative, recorded:** GPT-2 124M (layernorm, GELU, learned
positions; Karpathy's video and llm.c as references). Both need three to four new ops and both take
token ids from Python glue, so the schedule is identical; GPT-2 is the fallback if model literacy has
not landed by Sat 13 Feb. Read `rope_theta`, `rms_norm_eps` and head counts from `config.json`. The
byte-exact BPE tokeniser is off the Phase 4 path (a week of string handling that teaches nothing about
inference); token ids come from `tools/`, and the tokeniser is a week 29 option.

**Strands this phase** (reading 1 h Saturday; interview 90 min Wednesday):

| Week | Maths | Measure | Reading; interview |
|---|---|---|---|
| 15 | a 3×2 by 2×4 multiply with every strided index; a transposed view as swapped strides; broadcasting | the matmul loop at each of five stages; predict the blocked speed-up | Goto and van de Geijn (2008); virtual dispatch (virtual vs switch vs template, predicted then measured) |
| 16 | softmax as scores to distribution; max-subtraction; RMSNorm as a length without the mean; attention as an expected value; RoPE as the week 4 rotation on dimension pairs; one head on a 3-token toy by hand | softmax: one `expf` per element; what `-ffast-math` does and does not change | Attention Is All You Need, section 3; Milakov and Gimelshein (2018) on online softmax; exceptions (unwinding, `noexcept`, why inference code avoids them, `std::expected`) |
| 17 | bf16 vs fp32 bits; the weight file as offsets and strides | debugger checkpoint: raw mmap'd memory matched to the header | the GGUF specification; templates beyond containers, enough to read ggml-cpu dispatch |
| 18 | log-probabilities, cross-entropy, perplexity as exp of mean negative log-likelihood; 5 tokens by hand | Time Profiler on the generation loop: the three hot loops | FlashAttention (Dao et al., 2022) sections 1 to 3; PagedAttention (Kwon et al., 2023); classic questions 1 (rule of zero and five, copy elision, `std::move`, ODR, UB, virtual destructors, slicing, dangling references) |
| 19 | error propagation to perplexity; mean vs max error; why per-channel scales tame outliers | the Q4 nibble unpack; predict Q8_0 tokens/s from bytes moved | GPTQ (2022) and AWQ (2023), 30 min each; classic questions 2 (iterator invalidation, SSO, alignment, placement new, strict aliasing, `volatile` vs atomic, the memory model, data races) |
| 20 | activation outliers and why per-tensor W8A8 loses perplexity; the u8s8 vs s8s8 zero-point shift | int8 scalar kernel vs fp32: bytes moved vs time | SmoothQuant (stretch); ONNX Runtime's static quantisation docs; design questions for your employers (a KV cache under a memory budget; quantise for an int8 accelerator; a missing operator and fallback; why operator coverage dominates an edge SDK roadmap; ONNX vs GGUF); first mock interview Wed 24 Mar. Rubric checkpoint 3, Sat 27 Mar |
| 21 (C) | none | none | mock interview 2, Wed 31 Mar |

### Week 15: Tensor library (Mon 15 Feb to Sun 21 Feb 2027)

`Tensor` with shape, strides, views (slice, transpose, reshape without copy), broadcasting, and matmul
with arbitrary M from the start (prefill and batched decode need it): naive → loop-reordered →
cache-blocked → threaded with the week 11 job system. SIMD matmul is a stretch; the week 12 dot kernels
are reused as they are.

- **C++ you learn:** `std::mdspan` and strided views, `std::span<const float>` (introduced here),
  concepts, operator overloading done tastefully, testing against PyTorch and ONNX Runtime tensors from
  `tools/dump_reference.py` (which also exports the model to ONNX at a fixed sequence length, for
  reading and oracles, never for the C++ loader).
- **What it reuses:** week 1 flat grid, week 6 cache blocking, week 11 job system, week 12 SIMD.
- **Stretch:** beat naive matmul by 50×; within 3× of Accelerate for 576×576 and 1536×576.

### Week 16: Ops, as an op library with a conformance table (Mon 22 Feb to Sun 28 Feb 2027)

RMSNorm, RoPE (rotate-half pairing: Hugging Face weights expect it; llama.cpp permutes Q and K at
conversion to get interleaved), SiLU and the gated MLP, grouped-query attention (9 query heads over 3 KV
heads), softmax, embedding lookup with tied output weights, causal mask, residual adds. Every op sits in a
flat registry (name, shapes, dtype, reference fp32 implementation, optional int8 one; a table of function
pointers, no inheritance) and has a conformance test against the Buffer B NumPy oracle on one contiguous
shape case, under a written tolerance policy (absolute plus relative, per dtype); matmul and RMSNorm also
get a non-contiguous view case. Removed from this week to pay for the new ops: layernorm and GELU (now
stretch), the broadcast case and the `tools/` table script (now Buffer C if-time items; the gate's table
is pasted by hand from the doctest output if the script is not done).

- **C++ you learn:** numerical stability (max-subtraction, epsilon), fp32 accumulation, tolerance-based
  testing, `constexpr` tables, function-pointer tables.
- **Inference twin:** a runtime is judged by which operators it runs correctly and fast. Axelera and NXP
  publish which operators their accelerators run and which fall back to the CPU; your conformance table
  shows you know this. Two silent traps, named in the README: GQA head grouping and the RoPE pairing.
- **Stretch:** layernorm and GELU (needed only if GPT-2 becomes the fallback); conv2d as im2col plus
  your matmul, tested against PyTorch (the week 1 stencil again; these companies' first market is vision);
  fuse RMSNorm into the following matmul and measure.

### Week 17: Weight loading and the forward pass (Mon 1 Mar to Sun 7 Mar 2027)

Parse the safetensors file via mmap, convert bf16 to fp32 with your week 9 conversion, run 30 layers,
print the next token for "The history of Islamabad". On Fri 5 Mar, as the Friday milestone, build the
engine in the OrbStack machine as an arm64 Linux binary with `-march=armv8-a` and the dotprod kernels behind a runtime check
(the Mac's default flags would fault with an illegal instruction on an i.MX 8M Cortex-A53), linked with
`-static-libstdc++ -static-libgcc`; its size and start-up time go in the README beside tokens/s. That
binary is what an edge board or an accelerator's Arm host runs.

- **C++ you learn:** binary formats and headers, mmap and page faults, endianness, `std::string_view`,
  `std::expected` for file-format errors, `unordered_map`, runtime feature dispatch, the arm64 build.
- **What it reuses:** week 5 save/load if that stretch was done, otherwise the first file format is
  written here; week 10 pages; week 9 fp16 and bf16 conversions.
- **Stretch:** your own file format (header + tensor table + aligned blobs): GGUF in miniature; fully
  static with musl.

### Week 18: Generation (Mon 8 Mar to Sun 14 Mar 2027)

KV cache from the week 10 page table, autoregressive loop, week 5 sampling, streaming output; prefill vs
decode tokens/s. Batched decode for up to 4 sequences, each with its own KV pages and one weight read per
layer per step, is required only if the Wednesday check shows the week on time; otherwise it is the first
stretch, dated. Output: BENCH.md rows for B = 1 and B = 4 and two sentences on why throughput rises while
per-sequence latency barely moves.

- **C++ you learn:** performance engineering of a real program: Instruments Time Profiler and samply
  flame graphs, finding the 3 hot loops, amortising allocations.
- **What it reuses:** week 3 game loop, week 5 sampling, week 10 paged store becomes the KV cache.
- **Stretch:** continuous batching (a sequence joins or leaves between steps). Speculative decoding is
  not built (a draft model for a 135M target is not a credible exercise); it is read in week 24 for the
  interview question.

### Week 19: Quantised inference, llama.cpp style (Mon 15 Mar to Sun 21 Mar 2027)

Q8_0 weights with dequant-on-the-fly dot kernels (week 12), perplexity fp32 vs Q8_0 on a fixed public
text (for example the first 50k tokens of a Wikitext file) at a fixed context, recorded in BENCH.md so
Phase 6 can compare llama.cpp on the official SmolLM2-135M Q8_0 GGUF against your engine on your own
Q8_0 quantisation of the same safetensors; the block format is identical (32 values, one fp16 scale), so
tokens/s and perplexity are comparable, and a byte-level diff of the two Q8_0 tensors is a bonus check.

- **C++ you learn:** template specialisation per quant type, `if constexpr`, compile-time dispatch,
  accuracy vs speed trade-offs as an engineer.
- **What it reuses:** week 9 quantiser, week 12 quantised dot.
- **Stretch:** Q4_0 with the nibble unpack. Q4_K is removed from Phase 4.

### Week 20: Static int8 inference with calibration, edge-accelerator style (Mon 22 Mar to Sun 28 Mar 2027)

This week ends on Sun 28 Mar, the one deadline that does not move, so the must list is small. Must:
min-max calibration over the fixed set (32 sequences of 256 tokens, fixed in the spec), recording the
activation range at every linear layer's input; weights per-channel symmetric; activations per-tensor
asymmetric with a zero point (the TFLite int8 scheme); one scalar int8 × int8 kernel with int32
accumulation and saturating requantisation; W8A8 perplexity beside the week 19 fp32 and Q8_0 numbers on
the same evaluation set; a `calibrate` subcommand that writes per-layer scales to a file; and the one-page
calibration report (table plus a plot of per-layer error). Expect per-tensor W8A8 to be clearly worse
than Q8_0; the report explains why (activation outliers per layer). That explanation is the artefact.

- **C++ you learn:** int8 kernels with saturating requantisation, calibration passes over a graph.
- **Inference twin:** the quantise-then-compile flow of Axelera's Voyager and NXP's eIQ, and the
  vocabulary of their quantisation and calibration roles.
- **Stretch (in order; Fri 26 Mar only if the must list is green by Thu 25 Mar, else dated and dropped):**
  the 99.99th percentile calibration method with its own perplexity row; the comparison against ONNX
  Runtime's static quantisation tool on the same calibration data (it uses uint8 activations; note the
  zero-point shift before comparing) and reading its QDQ graph via the Python onnx package in `tools/`
  (no protobuf in C++); the week 12 dotprod int8 kernel; SmoothQuant-style scale migration; a nanobind
  binding exposing `generate` and `calibrate` to Python (Homebrew Python in a venv, one new CMake target
  and nothing else).

### Week 21: Buffer C (Mon 29 Mar to Sun 4 Apr 2027)

See section 3. Applications go out from Thu 1 Apr.

> **Gate, Sat 3 Apr 2027:** `./slm --prompt "The history of Islamabad"` produces coherent text on the
> Mac and the same binary runs in the arm64 container; a README table with tokens/s for fp32, Q8_0 and
> W8A8 at 1, 4 and 8 threads on the M5 plus the arm64 binary's size and start-up time; perplexity for
> each on the fixed text; the conformance table; the calibration report (min-max; percentile if done);
> rubric checkpoint 3; the Phase 4 write-up "I wrote a small-language-model inference engine in C++, from
> a particle system" and the LinkedIn post, both published by Sat 3 Apr.
> Written fallback: if Phase 4 slips past Buffer C, apply on 1 Apr with everything else and the
> forward-pass milestone; generation and the calibration report follow within April. The date does not
> move; the list may shrink by those items.

After week 20 you can open `ggml.c` and recognise every struct.

---

## 8. Phase 5: GPU kernels and backends (weeks 22 to 26)

**Goal:** write the kernel types that make up an inference backend, benchmark each against the vendor
library, and put a backend abstraction under your tensor library that runs the model on the CPU, on your
CUDA kernels and on a simulated accelerator with a restricted operator set: the shape of a runtime at an
accelerator company. Phase 5 runs at about 25 hours a week alongside applications, on a rented 4090
(develop on the Mac, rsync, build and run there; 12 to 15 GPU hours a week). **First hour on the box,
Mon 5 Apr:** run Nsight Compute on a trivial kernel; `ERR_NVGPUCTRPERM` means the host locks GPU counters,
so either rent weeks 23 and 24 from a provider that advertises profiling or use the fallback: achieved
bandwidth from `cudaEvent` timings and bytes moved, occupancy from the occupancy API, Nsight Systems for
the timeline. The gate is defined by timings, not counters. **Entry check** Mon 5 Apr: softmax by hand
with and without max subtraction; perplexity from five log-probabilities; why decode is memory-bound,
with your own number; the online-softmax rescaling rule; the Q4 layout.

**Decision point, Sat 17 Apr 2027 (end of week 23), in writing, in the log:** if interviews or the GPU
budget make the plan unrealistic, finish matmul and the fused attention kernel only, port the
elementwise and softmax kernels to Metal on the M5 (free, local, a real llama.cpp surface; host code via
metal-cpp so the engine stays C++), and still do week 25, which runs on the Mac.

**Strands this phase** (maths 15 min; reading 1 h; the Wednesday mock interview continues):

| Week | Maths | Measure | Reading; interview |
|---|---|---|---|
| 22 | occupancy as threads per core | the Life kernel's PTX in Compiler Explorer; debugger checkpoint: cuda-gdb if the pod allows ptrace, else compute-sanitizer | Nsight Systems docs; ggml-cuda's stencil kernels; mock interview (45 min) plus one timed whiteboard problem |
| 23 | shared-memory bytes per tile vs reuse | predict the tiled speed-up from bytes moved | FlashAttention-2 (Dao, 2023), sections 1 to 2; mock interview (45 min) plus one timed whiteboard problem |
| 24 | the algebra of online softmax | the matvec: shared-memory loads | ggml-cuda's quantised matvec; Orca (Yu et al., 2022) on continuous batching; Leviathan et al. (2023) on speculative decoding, 30 min, read for the interview question, not to build; mock interview (45 min) plus one timed whiteboard problem |
| 25 | none | offload ratio and DMA bytes per token vs modelled time | TVM "Bring Your Own Codegen" and MLIR's Toy tutorial chapters 1 to 3, with a half-page note mapping `supports_op` and your graph split to a compiler's partitioning pass (Axelera's Voyager compiler is built on TVM); mock interview (45 min) plus one timed whiteboard problem |

### Week 22: Life and reductions on the GPU (Mon 5 Apr to Sun 11 Apr 2027)

Port your week 1 automaton; stream frames back and render over SSH; then sum, max and argmax with warp
shuffles. The falling-sand port is a stretch.

- **CUDA you learn:** host vs device memory, `cudaMalloc`/`cudaMemcpy`, launch syntax,
  threads/blocks/grids, 2D indexing, `__shared__` for the stencil halo, `cudaEvent` timing, nvcc +
  CMake, reduction patterns, `__shfl_down_sync`, Nsight Systems basics.
- **Inference twin:** every elementwise and stencil op in ggml-cuda is this kernel with a different
  body; the one-block-per-row reduction you will see everywhere.
- **Stretch (two):** the falling-sand port; the Life stencil as a Metal compute shader on the Mac via
  metal-cpp, where unified memory means no copy: the contrast with `cudaMemcpy` is the lesson.

### Week 23: Matmul (Mon 12 Apr to Sun 18 Apr 2027)

Naive → shared-memory tiled → register tiling → vectorised loads; 576×576 through 4096×4096 against
cuBLAS on the same card (the gate is a ratio, so a 4090 is enough; an A100 column is optional polish).

- **CUDA you learn:** tiling theory, coalescing, register pressure, achieved bandwidth and occupancy
  (Nsight Compute where the host allows), template kernels for tile sizes.
- **Inference twin:** the kernel every engine lives or dies by; 50 to 70% of cuBLAS teaches more than
  any course.
- **Stretch:** tensor cores via `wmma` for fp16 (the 4090 has fp8 tensor cores too, reachable only via
  PTX or cuBLASLt; it lacks Hopper's clusters and TMA, which do not matter here).

### Week 24: Attention, softmax, RMSNorm and quantised matvec (Mon 19 Apr to Sun 25 Apr 2027)

Row-wise softmax and RMSNorm over a 2D tensor; fused softmax(QKᵀ)V with online softmax and tiling over
keys; dequant-on-the-fly Q8 matvec for decode.

- **CUDA you learn:** numerical stability on GPU, fusing to avoid HBM round trips, `__half`, `half2`
  maths, bit-unpacking on device, separate kernels for prefill (matmul) and decode (matvec).
- **Inference twin:** a flash-attention-lite and ggml-cuda's `mul_mat_vec_q`, built by you.
- **Stretch:** paged KV cache on device with your week 10 page-table design.

### Week 25: Backends: cpu, cuda and a simulated accelerator (Mon 26 Apr to Sun 2 May 2027)

A ggml-backend-shaped interface under your tensor library: buffer types, a per-op `supports_op` query,
graph splitting with CPU fallback and explicit copies at the boundary, function-table dispatch. Three
backends: cpu; cuda (weights and KV cache resident on the device, only tokens cross the bus); and
`npu-sim`, a CPU-side fake device that supports only int8 matmul, add, RMSNorm and SiLU, has a fixed 4 MB
local memory with explicit DMA, and a cost model (bytes moved plus int8 MACs at a nominal rate). The
scheduler offloads what the device supports, falls back for attention and softmax, and reports offload
ratio, DMA bytes per token and modelled time. The simulator runs entirely on the Mac, so this week
survives a GPU slip. cudaGraph capture and multi-GPU are removed.

- **You learn:** abstraction without virtual-call overhead, streams, overlapping copy and compute,
  pinned memory and async copies, memory planning against a fixed local memory.
- **Inference twin:** ggml-backend and its scheduler, ONNX Runtime's execution providers, and the core
  runtime problem at an accelerator company. The write-up says so: "the shape of a runtime for a device
  with a restricted op set".
- **Stretch:** the quantised matvec ported to Metal as a fourth backend, to prove the abstraction has
  no CUDA assumptions.

### Week 26: Buffer D (Mon 3 May to Sun 9 May 2027)

See section 3.

> **Gate, Sat 8 May 2027:** `./slm --backend cuda` generates text with every op in your kernels;
> `./slm --backend npu-sim` generates the same text with attention falling back to the CPU and a DMA
> bytes-per-token report; your matmul vs cuBLAS at four sizes; tokens/s CPU vs GPU for fp32 and Q8_0;
> write-up "From falling sand to flash attention: four CUDA kernels and a fake accelerator".

---

## 9. Phase 6: llama.cpp, ggml, contribution and the public record (weeks 27 to 30)

**Goal:** read the real thing with full comprehension, leave a mark on it, and package seven months of
work so a hiring manager understands it in five minutes. **Entry check** Mon 10 May, 30 min: the
rubric's Explain group (items 8 to 13), cold. The mock-interview strand continues weekly.

**Strands this phase** (Saturday measurement 1.5 h; the Wednesday mock interview; no maths):

| Week | Measure | Reading; interview |
|---|---|---|
| 27 | Compiler Explorer paste of one ggml `vec_dot` at `-O2`, hot instruction named | mock interview (45 min) plus one timed whiteboard problem; rubric checkpoint 4, Sat 15 May |
| 28 | llama.cpp on the official Q8_0 GGUF vs your engine on your Q8_0 weights, timed, prediction first | mock interview (45 min) plus one timed whiteboard problem |
| 29 | the contribution's before and after benchmark, with core class | mock interview (45 min) plus one timed whiteboard problem |
| 30 | none | mock interview as the two-minute repo story, timed |

### Week 27: Read ggml (Mon 10 May to Sun 16 May 2027)

- **Activity:** the tensor struct and strides, the compute graph, the quantisation block formats,
  ggml-cpu `vec_dot` kernels (the arm64 dotprod, i8mm and SVE-guarded paths first; they compile on your
  Mac and your container) and the thread pool, ggml-backend, ggml-alloc as memory planning mapped to
  your `npu-sim` local memory.
- **Your code it maps to:** weeks 15, 9, 12, 11, 25.
- **Output:** `phase6/ggml-notes.md`, a file-by-file map with "my equivalent" links and three things
  ggml does better than yours; rubric checkpoint 4 (the 1,000-line ggml item), Sat 15 May.

### Week 28: Read llama.cpp, vLLM and ONNX Runtime's int8 path (Mon 17 May to Sun 23 May 2027)

- **Activity:** `llama_decode`, batching and the KV cache, the sampling chain, GGUF loading and mmap, the
  server's continuous batching, the Metal 4 tensor-API path and the CUDA matvec kernels. Then vLLM at a
  pinned tag (v0.6.3: the scheduler, the block manager and the classic paged-attention kernel) and a diff
  against main's V1 scheduler and KV-cache manager. Then half a day on ONNX Runtime's CPU int8 GEMM
  (MLAS) and its integer matmul operators, mapped to your week 9 requantisation.
- **Your code it maps to:** weeks 18, 10, 5, 17, 24, 20.
- **Output:** `phase6/llamacpp-notes.md`; a page "PagedAttention and my week 10 page table" (block
  tables, copy-on-write prefix sharing, why the kernel reads a block table per sequence); a benchmark of
  llama.cpp (Metal, then CPU) on the official SmolLM2-135M Q8_0 GGUF versus your engine on your own Q8_0
  quantisation of the same safetensors, on the same perplexity text; the block format is identical (32
  values, one fp16 scale), so tokens/s and perplexity are comparable, and a byte-level diff of the two
  Q8_0 tensors is a bonus check (you will lose on speed; the write-up says exactly where and why). Serving concepts are read,
  not built; no vLLM contribution is planned.

### Week 29: Contribute (Mon 24 May to Sun 30 May 2027)

- **Activity:** pick one: a good first issue in ggml or llama.cpp; a ggml-metal or ggml-cpu arm64 kernel
  micro-optimisation with a benchmark; a GGUF or quantisation tool (a byte-exact BPE tokeniser checked
  against the Hugging Face tokenisers output is one option); or a published harness comparing quant
  formats across CPU, GPU and the simulated device. Check the ggml release notes for what the Metal
  backend does with the M5's GPU neural accelerators before choosing.
- **Output:** a merged PR, or a released tool with a README and numbers. Either is proof.

### Week 30: Package (Mon 31 May to Sun 6 Jun 2027)

- **Activity:** final version of the repo README as a story (first version in Buffer C): the arc, the
  benchmark table, the three best write-ups, a 10-second GIF of the sand game and a recording of the
  engine generating text. LinkedIn and CV updated. Phase 5 and 6 read as "in progress" if interviews took
  the hours.
- **Output:** a repo a stranger understands in five minutes.

> **End-of-curriculum gate, Sat 5 Jun 2027:** PR link or tool release; the README tells the story end to
> end; three write-ups published (performance, inference, GPU and backends). You can explain any line of
> ggml's quantised dot product and say what you would change.

---

## 10. The strands, and what proficient means

Six strands run under the challenges. They answer the audit's "promised but unscheduled" list, never
take hours from the Code block, and each produces something you can point at in the repo. Their per-week
content is in the "Strands this phase" tables above; this section defines them once. Together they take
about 115 hours beyond what the milestones already cost (the Hours column below sums to 22 + 26 + 18 +
16 + 25 + 8).

| Strand | Slot | Deliverable | Hours |
|---|---|---|---|
| **Maths intuition** | Saturday 1.5 h from week 4 (shorter in weeks 2 and 3; 15 min in weeks 22 to 24) | one hand computation checked against that week's program, in the log; the object is always something you hold in code that week | about 22 |
| **Measurement** | Saturday 1.5 h from week 1; the Experiment sits inside every benchmark milestone | every BENCH.md has an Experiment section: Prediction (a number and a direction, written before running), Measurement (numbers, machine, core class, date, flags), Explanation (two sentences; if wrong, which assumption). One Compiler Explorer paste a week at `-O2`, three lines in the log. Debugger checkpoints: week 3, Buffer A, weeks 11, 17, 22 | about 26, mostly costed |
| **Model literacy** | Saturday reading slot, 1 h, weeks 6 to 14; Buffer B 10 h | dated notes in `docs/model/`, `shapes.md` by Sat 13 Feb 2027, a NumPy forward pass of one block checked to 1e-4 (the one Python you write; scheduled in the Buffer B must list). The slot never grows past the hour: in weeks 10 to 13, where model literacy and papers share it, the second reading of the week is marked "if time" in the Phase 3 table | about 18 |
| **Reading** | Saturday reading slot, 1 h, weeks 10 to 25 | `docs/papers/<short-id>.md` with five headings: the claim; the figure that matters, redrawn; what I built that it maps to; one number I can check against my own; one question an interviewer could ask. Read the paper the week after you built the thing (the roofline paper is the exception) | about 16 |
| **Interview preparation** | Wednesday Read block at its 90-minute upper bound, from Wed 10 Feb 2027 (the Code block is untouched); from Wed 24 Mar 2027 (week 20) that slot is a weekly 45-minute mock interview with Claude as interviewer (one fundamentals question, one design question, one "walk me through your repo"), transcript to `docs/interviews/`, plus a 30-minute timed whiteboard problem typed into `scratch/` and tested | the six skipped-topic sessions (weeks 15 to 20: 30 min of explanation from Claude on a toy, 60 min of exercise you write) are the only interview items that count at the Phase 4 gate; CV draft in Buffer B, final in Buffer C; the two-minute spoken version of each gate rehearsed. All on toys in `scratch/`, so CLAUDE.md lets Claude write the exercises | about 25 by 6 Jun (17 Wednesdays at 90 min) |
| **Proficiency rubric** | four cold checkpoints, 2 h each from the maths and reading slots: Sat 12 Dec 2026, Sat 13 Feb, Sat 27 Mar, Sat 15 May 2027 | each item dated with a link to evidence (a commit, a log entry, a transcript) | 8 |

### What proficient means

Portfolio artefacts prove output; this rubric defines the skill. Check yourself cold, without the book
or Claude. Eighteen items.

**Write:** (1) from a written spec, a 300-line program with tests, warning-free and sanitizer-clean, in
one day, no reference open; (2) choose value, reference, const reference, span or pointer for every
parameter and say why; (3) a class with an invariant and exactly the special members it needs, and what
each does; (4) RAII for a non-memory resource without being told; (5) `unique_ptr`, `shared_ptr` and a
raw pointer used correctly, and a case where none is right; (6) a function template with a concept, and a
NEON dot checked against scalar within a tolerance you can justify; (7) a CMake project with tests,
sanitizers and a release target from an empty directory in 15 minutes.

**Explain:** (8) what the compiler and linker do with one header and two sources, and fix an
undefined-symbol or ODR error without searching; (9) the IEEE 754 layout, the rounding error of Q8 and
Q4 as numbers, when to accumulate in fp32, what a zero point is for; (10) acquire and release in two
sentences, and a data race; (11) virtual dispatch, exceptions and templates well enough to say why
inference code avoids the first two; (12) the two classic-question lists without notes; (13) any
CONCEPTS.md row marked owned, in two sentences with an example.

**Measure and debug:** (14) predict within a factor of two the running time of a loop over N elements
from cache and bandwidth reasoning, then measure; (15) read the `-O2` assembly of a 10-line loop and say
whether it vectorised and what the hot instruction is; (16) read a sanitizer report and a backtrace to
the line and fix the cause; (17) step through a function in lldb, print a container, set a conditional
breakpoint, switch threads; (18) read 1,000 lines of someone else's C++ (ggml) and draw its data
structures.

**Expected state.** 12 Dec 2026: items 1, 2, 4, 7, 8, 16 and 17 (no threads) with the book open, item 3
as rule of zero only. 13 Feb 2027: items 1 to 10 and 13 to 17 cold. 27 Mar 2027: everything but 18 cold,
item 12 as list 1 cold and list 2 with notes, item 18 as ggml's block structs and one `vec_dot` kernel
(about 300 lines) with the block layout drawn. 15 May 2027: all eighteen cold. **Proficient, for the
purpose of applying,** means the 27 Mar state plus at least 80% of the CONCEPTS.md rows for weeks 1 to 20
marked owned and none rusty for more than two weeks. If fewer than fourteen items are cold on 27 Mar,
applications still start on 1 Apr; the gap list becomes the interview strand's agenda.

---

## 11. Concept index (frozen seed; CONCEPTS.md is live)

**`CONCEPTS.md` in the repository root is the live concept graph.** It was seeded from the table below
on 7 Nov 2026 and has already grown past it (a status column, per-chapter links into the Week 1 book, a
"Reading large codebases" area, rows this table never had). The table below is a **frozen seed**, kept
for the record and never edited again. Where the two disagree, CONCEPTS.md is right. This document names
weeks and challenges; CONCEPTS.md names concepts; a week's README cites CONCEPTS.md rows, never this
table. On 7 Nov 2026, with this revision, CONCEPTS.md was re-keyed to the new week numbers (Life weeks 1
and 2, Snake 3, Tetris 4, roguelike 5, particles 6, Boids 8, numbers 9, paged store 10, job system 11,
SIMD and roofline 12, capstone 13, tensor 15, ops 16, loader 17, generation 18, quantised inference 19,
int8 calibration 20, GPU 22 to 25, reading 27 to 29), its FTXUI, perf, tokeniser, Q4_K and GPT-2 cells
were corrected to match sections 4 to 9, its Debugger row moved to week 3, its pointers row to Buffer A
and week 10, its span row to week 15 and its CI row to week 1, and it gained three areas for the strands:
**Maths** (one row per Saturday topic, same status values, so spaced retrieval covers dot products and
variance the way it covers RAII), **Model** (what a transformer block computes, each row with the note
that teaches it) and **Interview** (the skipped topics and the two classic-question lists, status tracking
whether you can answer cold).

| Area | Concepts | Introduced (challenge) |
|---|---|---|
| **Language core** | Compilation model, headers, translation units, `const`, references, value semantics, struct/class, invariants, constructors/destructors, RAII, `enum class`, `switch`, `std::optional` | Life, Snake, Tetris |
| **Ownership** | Stack vs heap, what a pointer is (lldb), `unique_ptr`, `shared_ptr`, when to use raw pointers, copy vs move, rule of five, custom deleters, allocators, `std::pmr`, arenas and pools | Buffer A, paged store |
| **Standard library** | `vector`, `array`, `deque`, `span`, `string`/`string_view`, `unordered_map`, `priority_queue`, `<algorithm>`, `<ranges>`, `<random>`, `<chrono>`, `<bit>`, `mdspan`, `expected`, `print` | Life to Boids, tensor library, loader |
| **Generic programming** | Templates, concepts, `if constexpr`, specialisation, compile-time dispatch, `constexpr` functions, function-pointer tables | Boids, tensor library, ops, quantised inference |
| **Numbers** | IEEE 754, fp16/bf16, fixed point, overflow and UB, `bit_cast`, block quantisation (Q8_0, Q4_0), affine int8 (scale, zero point, per-channel, requantisation), calibration, numerical stability, error measurement, perplexity | Numbers, ops, quantised inference, int8 calibration |
| **Memory and performance** | Cache lines, AoS/SoA, alignment, prefetching, blocking, bandwidth vs compute, roofline, Instruments counters, cachegrind, flame graphs, benchmarking on heterogeneous cores, `-O` levels, `-march` | Particles, SIMD and roofline, generation |
| **Parallelism** | Threads, mutexes, condition variables, atomics, memory ordering, false sharing, barriers, job systems, work stealing, ThreadSanitizer | Job system |
| **SIMD** | NEON (M5) then AVX2 (CI, rented x86), dotprod and i8mm, horizontal reductions, auto-vectorisation, reading assembly | SIMD and roofline |
| **Systems** | Raw terminal mode, ANSI escapes, file I/O, binary formats, mmap, endianness, UTF-8, CMake, CI on three runners, release workflow, sanitizers, lldb/gdb, arm64 Linux build and runtime dispatch | Life to roguelike, capstone, loader |
| **GPU** | CUDA: host/device memory, launches, grids/blocks/warps, shared memory, coalescing, reductions, shuffles, occupancy, tiling, fusing, streams, Nsight Systems. Metal (stretch): compute shaders, unified memory | Phase 5 |
| **Inference** | Tensors and strides, matmul, attention, GQA, RMSNorm, RoPE, SwiGLU, softmax, embeddings, KV cache, paged KV, prefill vs decode, sampling, quantised dot products, operator coverage and conformance against an oracle, tolerance policy, backend abstraction, graph splitting and CPU fallback, ONNX and GGUF, continuous batching and scheduling (read, not built) | twins in Phases 1 to 3; Phases 4 to 6 |
| **Maths** | Vectors and matrices as transformations, dot product as projection, distributions and sampling, expected value, floating point and quantisation noise, Amdahl, arithmetic intensity, log-probabilities and perplexity, error propagation | Saturday strand, weeks 2 to 24 |
| **Model** | What a transformer block computes, the shapes of one block, the residual stream, KV-cache sizing, the reference forward pass | Saturday strand, weeks 6 to 14 |
| **Interview** | Virtual dispatch, exceptions, templates, the two classic-question lists, the edge-accelerator design questions, speculative decoding (read, not built), the repo story | Wednesday strand, weeks 14 to 30 |

**Deliberately not taught through challenges**, because inference code does not use them: deep class
hierarchies and virtual dispatch as a design style (one function-table interface in week 25 is enough),
exceptions as control flow, template metaprogramming beyond `if constexpr` and concepts, Boost, Qt,
coroutines, modules. C++ interviews ask about all of them, so the interview strand covers them in weeks
15 to 20 on toy problems.

---

## 12. Evidence trail

The repo is the application. **By Sun 28 Mar 2027 these exist, public, and nothing else is required to
apply on Thu 1 Apr:** (1) the repository with CI running tests and sanitizers since week 1, on three
runners since Mon 14 Dec 2026; (2) four Phase 1 games with tests and BENCH.md numbers; (3) the quantiser
with mean and max error for Q8_0, Q4_0 and per-channel int8 and one calibration experiment; (4) NEON
kernels with a scalar-vs-SIMD table and the roofline chart of the M5 on both core classes, AVX2 green on
CI if the week 12 stretch was done; (5) the capstone, tagged and released, built for macOS and arm64
Linux; (6) the CPU inference engine as a Mac binary and an arm64 Linux binary with the tokens/s and
perplexity table for fp32, Q8_0 and W8A8, the conformance table and the calibration report (min-max;
percentile if done); (7) three phase write-ups and a draft of the LinkedIn post; the Phase 4 write-up and
the post are published by Sat 3 Apr, the gate day, and the first applications on Thu 1 Apr do not wait
for them; (8) a CV and a one-page portfolio summary; (9) the rubric answered honestly and about eleven
paper notes.

| By | Artefact | What it proves |
|---|---|---|
| **Sun 13 Dec 2026** (trajectory) | Four terminal games, tests, CI, first write-up | Correct, idiomatic modern C++ from scratch |
| **Sun 17 Jan 2027** (trajectory) | Particle benchmarks (AoS → SoA history), quantiser with error numbers for Q8_0, Q4_0 and int8 | You think in cache lines, bytes and zero points |
| **Sun 14 Feb 2027** | Capstone release with CI and arm64 build; roofline chart of two core classes | You can ship, measure and target Arm Linux (runtime and kernels teams) |
| **Sun 28 Mar 2027** | Engine README with tokens/s and perplexity on the M5 and the arm64 binary; conformance table; calibration report; LinkedIn post drafted (published Sat 3 Apr) | You understand inference, operator coverage and int8 calibration (runtime, kernels, quantisation and SDK teams) |
| **Sun 9 May 2027** (in progress on 1 Apr) | CUDA backend, matmul vs cuBLAS, the backends write-up with cpu, cuda and the simulated accelerator and its DMA-bytes-per-token result | GPU kernels, and the shape of a runtime for a device with a restricted op set (runtime and compiler teams) |
| **Sun 6 Jun 2027** (in progress on 1 Apr) | Merged PR or tool, llama.cpp on the official Q8_0 GGUF vs your engine on your Q8_0 weights, README as a story, three write-ups | You can work in a real codebase and explain your work |

**Who opens what.** A runtime or kernels team reads the roofline, the arm64 binary row and the backends
write-up; a quantisation or SDK team reads the calibration report and the conformance table; everyone
reads the engine README first; interview demos run on the Mac, not a rented GPU. For a neuromorphic
employer such as Innatera the transferable parts are the embedded C++ runtime, the SDK boundary and the
quantisation tooling, not the model; spiking networks are not covered. GPU experience appears as a plus
in some Dutch accelerator postings, so Phase 5 is worth finishing after April where interviews allow. A
Dutch systems team seeing weeks 1 to 20 already sees more than most candidates show.

---

## 13. Open decisions and what the methodology doc covers

Settled on 7 Nov 2026 by your answers:

- [x] **GPU:** rented Nvidia confirmed; budget USD 400 to 500 from January 2027, more if needed.
  Itemised (estimates from 7 Nov 2026): 50 to 60 hours on a 4090 at USD 0.5 to 0.89, USD 30 to 55; a 50
  GB network volume for two months, about USD 7 (a stopped pod still bills its disk); optional A100 or
  H100 session, USD 10 to 25; optional bare-metal x86 month for the week 12 stretch, EUR 30 to 70;
  optional Raspberry Pi 5 with supply and cooler, EUR 110 to 130; reserve for a second attempt at a
  kernel, USD 100 to 150. Total about USD 150 to 400, inside the budget with margin.
- [x] **Linux container:** OrbStack, arm64 Ubuntu 24.04 with LLVM 20 from apt.llvm.org, from 14 Dec
  2026, for cachegrind, gdb, parity and the arm64 deployment target; not AVX2, not perf counters.
- [x] **Public from day one:** the repository is public at github.com/Daniishkhan/cpp-101 from 7 Nov
  2026, with commits under your GitHub noreply address, and the README says it is a learning repo until
  the capstone. Public repos also run CI without the ten-times macOS minute multiplier.

Decided in this revision; say by Mon 9 Nov 2026 if you disagree:

- [x] **Phase 4 model:** SmolLM2-135M, GPT-2 124M as the recorded fallback, confirmed Sat 13 Feb 2027.
- [x] **Rest day:** Sunday; Saturday is strand day.
- [x] **Day one:** Mon 9 Nov 2026 rather than the Tue 10 Nov you named, so every week is an ISO week
  (you confirmed the re-dating on 7 Nov 2026).

Still open, decide before the date named:

- [ ] **Raspberry Pi 5 (8 GB)** from about 11 Jan 2027: a real arm64 Linux board (Cortex-A76, NEON
  without SVE like the M5, working perf counters, a thermal limit, a 17 GB/s bandwidth ceiling), the
  device class edge-LLM products ship on. If yes: setup capped at one evening, a Pi row in the capstone
  table and the Phase 4 gate table only, the Cortex-A76 optimisation guide in the week 12 reading.
  Recommendation: yes, if the budget allows.
- [ ] **Bare-metal x86 for a month** (Hetzner auction class) for the week 12 stretch, from the reserve;
  the account needs identity checks, so open it in week 11 if yes.
- [ ] **Other days off between February and April 2027:** holidays, travel or fixed commitments that
  fall in Buffer B or weeks 15 to 20 (the pivot). List them in the log before the week they fall in;
  a buffer absorbs up to three days, and a longer stretch at reduced hours keeps the Code block and
  trims the Saturday strands first.
- [ ] **Days off 24 Dec 2026 to 3 Jan 2027:** Buffer A assumes about half a week of work. Two full weeks
  off makes Boids a buffer too and drops the capstone's second half, not Phase 4.
- [ ] **Which team first:** runtime and kernels, quantisation and calibration tooling, or SDK and
  deployment; it decides whether the backends write-up or the calibration report is polished first in
  April. Paste two real job descriptions from Axelera, NXP or Innatera before Buffer B so the week 20
  design questions and the rubric are checked against what they ask.
- [ ] **Nebius-style GPU-cloud serving** as a real second target or only a fallback; if real, the A100
  session and the FlashAttention-2 reading become required.

### Follow-ups (done 7 Nov 2026)

This revision contradicted six files in the repository. All were corrected on 7 Nov 2026, the same day,
along with the forward references in the Week 1 book and `common/README.md`:

- `phase1-terminal/01-life/README.md`: "Week 1 (10 to 16 Nov 2026)" becomes weeks 1 and 2, Mon 9 to Sun
  22 Nov 2026; "the CUDA port of this very program in week 18" becomes week 22; the milestone table is
  split into M1 to M4 (week 1) and M5 to M7 (week 2), recorded in the log's Scope changes table.
- `docs/log/2026-W46.md`: header and plan to Mon 9 to Sun 15 Nov 2026; the Sunday row removed; M5 to M7
  moved to a new `docs/log/2026-W47.md`.
- `README.md`: the intro, the phase table, the layout block and the capstone note re-numbered to 30
  weeks, 25 to 30 planned hours, SmolLM2-135M and the week 13 capstone; phase folder ranges to weeks 1 to
  5, 6 to 10, 11 to 14, 15 to 21, 22 to 26 and 27 to 30.
- `docs/setup.md`: the "When you need a Linux box" table says the container is arm64 with no `perf` and
  no AVX2 and that counters come from Instruments; Google Benchmark from week 6; lldb from week 3; the
  full Xcode download on Sat 28 Nov 2026; the Python row says a Homebrew 3.12 venv (PyTorch, NumPy,
  safetensors, onnx, tokenisers) is required from Mon 14 Dec 2026, not system Python until week 11; LLVM
  20 from apt.llvm.org in the container.
- `CLAUDE.md` repo facts: "LLVM clang on Linux after week 5" becomes "LLVM 20 in the container from week
  6"; "Google Benchmark from week 5" becomes week 6.
- `docs/methodology.md`: the items below.
- `docs/book/week1/`: forward references to later weeks and to the end goal re-numbered; the book's own
  name ("the Week 1 book") and its Week 1 constructs rule are unchanged.

`docs/methodology.md` was updated on 7 Nov 2026 to cover: the daily blocks with Saturday's own shape
(section 3) and Sunday off; the spec ritual sized for the weekday Code blocks (about 12 hours of typing
plus the Read blocks that feed them) rather than the whole week; how `CLAUDE.md` makes Claude a tutor
rather than a code generator; the review protocol, with the whole-challenge review on Friday; spaced
retrieval from CONCEPTS.md, including the Maths and Model areas; the log and the Saturday write-up, with a
Strands checklist; reference implementations (nanoGPT, llama2.c, Hugging Face transformers for dumps,
ggml) used without copying, with "from week 13" in that section becoming "from week 15"; and the slip
ladder, which points at section 3 here, with two changes: lever 3 ("take two extra days and shift the
calendar") becomes "the overflow goes to the next buffer; Saturday and Sunday are never slip days", and
"two failed entry-check items means the phase starts on Tuesday" is added as a numbered rung.

---

## 14. Changelog

**2026-11-07: revision after the first audit.**

- Thesis sharpened to the real target (small models on edge and CPU; Axelera, NXP eIQ, Innatera; serving
  literacy read from vLLM); "CUDA that competes with vendor code" replaced as the headline by the
  calibration report, conformance table, arm64 binary and backend abstraction, because those are what
  these hiring managers open.
- Calendar anchored: 10 Nov 2026 is a Tuesday, so week 1 is ISO 2026-W46 (Mon 9 Nov to Sun 15 Nov);
  every date is now absolute and Monday-based.
- 26 seven-day weeks became 30 weeks with Sunday off: 26 challenge weeks plus buffers on 21 Dec, 8 Feb,
  29 Mar and 3 May with must and if-time lists, because the first draft had no slack and put Christmas
  inside two challenge weeks.
- Day one moved from Tue 10 Nov to Mon 9 Nov 2026; `01-life/README.md` and `docs/log/2026-W46.md` are
  re-dated and Life re-split as M1 to M4 (week 1) and M5 to M7 (week 2) (section 13 follow-ups).
- Entry checks added at the start of Phases 2 to 6 (Mon 14 Dec 2026, 18 Jan, 15 Feb, 5 Apr and 10 May
  2027; 30 min, cold, dated); two failures start the phase on Tuesday, recorded as a rung of the
  methodology slip ladder.
- Homebrew Python 3.12 venv (PyTorch, NumPy, safetensors, onnx, tokenisers) required from Mon 14 Dec
  2026; `docs/setup.md` to be updated (section 13 follow-ups).
- Life takes two weeks (17 chapter files and seven milestones do not fit six days for a first-time
  programmer); the stand-alone roofline week merged into the SIMD week to pay for it.
- Roguelike de-scoped: pointers to Buffer A (lldb) and week 10 (ownership), span to week 15, A* and the
  binary format to stretch.
- Hardware fixed: the container is arm64 with no AVX2 and no counters; counters from Instruments (full
  Xcode); AVX2 ports and their correctness on the free x86 runner are the first week 12 stretch, timings
  a bare-metal stretch (RunPod pods hide the PMU too); NEON primary because the employers' hosts are Arm;
  LeakSanitizer unavailable on arm64 macOS; heterogeneous-core benchmarking rules recorded; the container
  and CI compiler is LLVM 20 from apt.llvm.org, because the distro's clang 18 libc++ lacks `std::jthread`
  and `hardware_destructive_interference_size` and its g++ lacks `<print>` or `<mdspan>`.
- The debugger, promised from week 2 and never taught, is taught in week 3 with four checkpoints.
- Six strands added with slots and deliverables (maths, measurement with a prediction-first Experiment
  and a weekly Compiler Explorer paste, model literacy weeks 6 to 14, papers weeks 10 to 25, interview
  preparation from Wed 10 Feb 2027 in a 90-minute Wednesday Read block, a rubric with four checkpoints),
  funded by Saturday, the Read block after the book, and specs sized for the weekday Code blocks; strands
  never block a gate and are never slip days. The planned week is 25 to 30 hours, not 30 to 35; the 5 to
  10 hours left of the 35 you have are unplanned slack for slips and Friday stretches.
- Phase 4 re-scoped (15 Feb to 4 Apr 2027): model literacy before it starts, tokeniser from glue, Q4_K
  and speculative decoding removed, SIMD matmul and Q4_0 as stretch, batched decode conditional, matmul
  with arbitrary M from the start, and a new week 20 on static int8 with calibration, paired with Phase 5
  shrinking from five kernel weeks to three plus a backends week.
- Model changed from GPT-2 124M to SmolLM2-135M (RMSNorm, RoPE, SwiGLU, GQA) so the engine maps one to
  one onto llama.cpp, GGUF and the edge thesis; GPT-2 kept as the recorded fallback; bf16 loading,
  rotate-half RoPE and config-driven parameters named as the traps.
- Week 9 gains the affine int8 quantiser, a calibration experiment, and fp16 and bf16 conversion as must
  items (week 17's bf16 safetensors and the Q8_0 block scale need them; only Q4_K super-blocks stay
  stretch); week 16 becomes an op library with a conformance table and tolerance policy, paid for by
  moving layernorm and GELU to stretch, cutting conformance to one contiguous case per op plus a
  non-contiguous view for matmul and RMSNorm only, and moving the broadcast case and the table script to
  Buffer C; week 17 produces an armv8-a arm64 Linux binary on Fri 5 Mar.
- Week 12 keeps the NEON kernels and the roofline (peak FLOPs and memory bandwidth) as must items; the
  AVX2 ports, cache bandwidth and the x86 timings are stretch, in that order, so no challenge code lands
  on a Saturday.
- Week 20 trimmed to one calibration method (min-max), one scalar int8 kernel, W8A8 perplexity, the
  `calibrate` subcommand and the report; the percentile method, the ONNX Runtime comparison and QDQ
  reading, the dotprod kernel, SmoothQuant and the nanobind binding are a dated stretch list.
- Phase 5 reshaped: Life plus reductions, matmul, attention with softmax and RMSNorm and quantised
  matvec, then backends with cpu, cuda and a simulated accelerator; cudaGraph and multi-GPU removed;
  Nsight Compute fallback added; Metal moved from afterthought to stretch, baseline and contribution
  option; fallback decision dated Sat 17 Apr 2027; 25 hours a week after 1 Apr.
- ONNX added as oracle, second quantisation baseline and Phase 6 reading; vLLM added as week 28 reading
  at a pinned tag.
- Applications moved from "week 12" to Thu 1 Apr 2027 with a nine-item bar due Sun 28 Mar and a written
  fallback; evidence trail re-dated with honest "in progress" rows; June 2027 declared float.
- CI from week 1 (macOS), three pinned runners from 14 Dec 2026, instead of week 12; GIF instead of
  video; the `make play` menu and the FTXUI switch dropped as polish the roles do not reward.
- Phase 6 gains a strand table (measurement and the weekly mock interview); the mock interview starts
  Wed 24 Mar 2027; speculative decoding is read (Leviathan et al., 2023, week 24) for the interview
  question though not built.
- CONCEPTS.md declared the live graph with Maths, Model and Interview areas; the index here frozen as a
  seed keyed by challenge name.
- GPU budget re-costed with 7 Nov 2026 estimates and itemised against the confirmed USD 400 to
  500; GPU, container, model and rest-day decisions settled; Pi 5, bare metal, days off in Feb to Apr, Christmas days,
  target team and Nebius added as open decisions.
- Spelling converted to British throughout.
