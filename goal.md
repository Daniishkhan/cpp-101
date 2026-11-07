# C++ for Inference Engineering: Curriculum Spine

**7 November 2026 · Danish** (revised and trimmed the same day; see the [changelog](#14-changelog))

> In 30 weeks (Mon 9 Nov 2026 to Sun 6 Jun 2027: 26 challenge weeks and four buffers, 25 to 30 planned
> hours a week) you go from printing to the terminal to a quantised C++ inference engine for a small
> Llama-architecture model, running on your Mac and as an arm64 Linux binary, with your own int8
> calibration tooling and CUDA kernels behind a backend abstraction, and then to reading llama.cpp and
> ggml fluently. Games carry the first half; a model replaces the game in the second, with the same code
> shapes. By Thu 1 Apr 2027 the repository is an application.

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

**The target.** C++ inference engineering for small open language models that run privately on edge
devices and CPUs, at Dutch edge-AI accelerator and semiconductor employers: Axelera AI in Eindhoven,
NXP's edge AI side (eIQ), Innatera and similar, with GPU-cloud serving teams such as Nebius as a second
target. These teams build runtimes, kernels, quantisation and calibration tooling, compilers and
deployment SDKs. Int8 and operator coverage matter to them as much as LLM decode, their hosts are Arm,
and their formats are ONNX and GGUF. Serving (continuous batching, paged attention, scheduling) you read
in vLLM rather than build.

Five principles shape every week:

1. **Every challenge has an inference twin**, named in its README: grid = tensor, game loop = decode
   loop, N² collisions = N² attention. You learn the mechanics llama.cpp and edge runtimes are built from.
2. **One runnable artefact per week**, with a benchmark number committed to the repo.
3. **Terminal only until the pivot.** Raw ANSI and no graphics library, so the focus stays on data and
   loops.
4. **Hand-code first, AI reviews after.** `CLAUDE.md` has Claude explain, generate challenges and review;
   it never writes solutions.
5. **Six strands run under the challenges** (section 10), each with a slot and a deliverable, and none
   takes time from the Code block.

**The arc:** terminal games (weeks 1 to 5) → memory and performance (6 to 10) → parallelism, SIMD and a
capstone game (11 to 14) → tensor library and a small language model, int8 calibration included (15 to
21) → CUDA kernels and backends with a simulated accelerator (22 to 26) → llama.cpp, ggml and a
contribution (27 to 30).

---

## 2. Toolchain, machines and repo layout

Decided once. You develop on this Mac for all 30 weeks and add targets. A Linux container on Apple
Silicon is arm64 Linux, with no AVX2 and no hardware performance counters, so each tool runs where it
exists. The setup checks live in `docs/setup.md`.

| Decision | Choice and reason |
|---|---|
| **Standard** | C++23: `std::span`, `std::expected`, `std::print`, `std::mdspan`; llama.cpp's C++17 is a subset |
| **Compiler** | Apple clang 21 on the Mac; LLVM 20 (`clang++-20 -stdlib=libc++`) in the container and on Linux CI, because the distro compilers lack C++23 pieces that weeks 11 and 15 need; nvcc on the GPU box |
| **Build** | CMake + Ninja, one `CMakeLists.txt` per challenge, as llama.cpp and ggml do |
| **Linux (arm64)** | An OrbStack Ubuntu 24.04 machine from Mon 14 Dec 2026, for gdb, cachegrind and the arm64 deployment target |
| **Counters and profiles** | Instruments (`xcrun xctrace`) from week 6, which needs the full Xcode app (start the download on Sat 28 Nov 2026); `samply` for flame graphs |
| **x86** | Not owned. AVX2 correctness on the free x86 runner and AVX2 timings on rented bare metal (a Hetzner auction server, EUR 30 to 70 a month) are week 12 stretches; rented pods hide the counters too |
| **Tests and benchmarks** | doctest, vendored. A `std::chrono` harness in weeks 1 and 2, Google Benchmark from week 6. The M5 has 4 performance and 6 efficiency cores: ask for performance cores, run on mains power, report the median of ten runs and the core class |
| **Sanitizers and debugger** | ASan and UBSan in every Debug build, TSan from week 11; there is no LeakSanitizer on arm64 macOS. lldb is taught in week 3; gdb in the container |
| **Assembly** | Compiler Explorer, weekly from week 1 |
| **CI** | GitHub Actions from week 1: `tools/ci-challenges.sh` on `macos-26`, plus Linux runners with LLVM 20 by 14 Dec 2026. Builds stay green; tests stay red until you write the code |
| **Style** | clang-format and clang-tidy in a pre-commit hook; raw ANSI throughout, with FTXUI optional in the capstone |
| **GPU** | A rented RTX 4090 (RunPod or Vast.ai), weeks 22 to 25, 50 to 60 hours, about USD 0.5 to 0.9 an hour on 7 Nov 2026. Metal on the M5 is the free stretch, baseline and contribution surface |
| **Python** | Glue only, in a Homebrew Python 3.12+ venv from week 6: reference tensors, token ids, plots, and one NumPy forward pass of a transformer block as a test oracle. No challenge is solved in Python |

### Where each week runs

Weeks 1 to 5 run on the Mac. Weeks 6 to 10 add the arm64 container. Weeks 11 to 14 add the x86 runner
and rented bare metal for the week 12 stretches. Weeks 15 to 21 run on the Mac, with the container
building the week 17 arm64 binary. Weeks 22 to 26 add a rented 4090 for CUDA. Weeks 27 to 30 use the Mac
and the container. Every spec ritual names the machine the week's numbers come from.

### Repo layout

```text
cpp-101/
  README.md  CLAUDE.md  CONCEPTS.md  goal.md
  docs/                                 # setup, methodology, logs, write-ups, the book, model/, papers/, interviews/
  common/                               # tiny shared headers you grow yourself
  phase1-terminal/ ... phase6-llamacpp/  # one folder per challenge: README, CMakeLists, src, tests, BENCH.md
  tools/                                # CI, book, tutor and reference-dump scripts
  .github/workflows/                    # CI, and the book's check and publication
```

Your own second attempts go on a `solutions` branch, merged only after the first version is green. Each
challenge README is written before its week in the 20-minute spec ritual and sized for the weekday Code
blocks. The book is published at [daniishkhan.github.io/cpp-101](https://daniishkhan.github.io/cpp-101/)
whenever it changes and passes its check; that copy has no tutor, because your API key stays on your
computer.

---

## 3. Phase map, calendar and the shape of a week

Thirty ISO weeks, Monday to Sunday; **week 1 is Mon 9 Nov to Sun 15 Nov 2026** (2026-W46). Each phase
ends with a Saturday **gate**: something that runs, a number and a write-up. Slip into the buffer rather
than skip a gate.

| Phase | Weeks and dates | You build | Twin | Gate |
|---|---|---|---|---|
| **1 Terminal games** | 1 to 5: 9 Nov to 13 Dec 2026 | Life (two weeks), Snake, Tetris, a roguelike slice | Tensors and strides, decode loop, rotation, sampling | 12 Dec: four games, tests and CI green, BENCH.md numbers, write-up |
| **2 Memory and performance** | 6 to 10, Buffer A in 7: 14 Dec 2026 to 17 Jan 2027 | Particles, Boids, numbers (Q8_0, Q4_0, affine int8), paged entity store | Weight layout, attention N², quantisation, PagedAttention | 16 Jan: 100k particles at 60 fps; quantiser with measured error |
| **3 Parallelism** | 11 to 14, Buffer B in 14: 18 Jan to 14 Feb 2027 | Job system, NEON kernels and roofline, falling-sand capstone | Thread pool, ggml dot kernels, roofline | 13 Feb: capstone released with CI and an arm64 build; roofline chart |
| **4 The pivot** | 15 to 21, Buffer C in 21: 15 Feb to 4 Apr 2027 | Tensor library, op library, SmolLM2-135M forward pass and generation, Q8_0, static int8 with calibration | This is inference | 3 Apr: coherent text on the Mac and in the container; tokens/s and perplexity for fp32, Q8_0 and W8A8; calibration report |
| **5 GPU and backends** | 22 to 26, Buffer D in 26: 5 Apr to 9 May 2027 | GPU Life and reductions, tiled matmul, fused attention, quantised matvec, cpu, cuda and simulated backends | ggml-cuda, flash attention, ggml-backend | 8 May: the model on your CUDA kernels and on the simulated device; matmul at 50 to 70% of cuBLAS |
| **6 llama.cpp** | 27 to 30: 10 May to 6 Jun 2027 | Annotated reading of ggml, llama.cpp, vLLM and ONNX Runtime's int8 path; a PR or tool | All of it | 5 Jun: a PR or tool release; three write-ups |

**Week 15 (Mon 15 Feb 2027) is the hinge:** before it the repo looks like game development, after it
like inference engineering, and the code barely changes. **Applications open Thu 1 Apr 2027**, with
everything they need done by Sun 28 Mar (section 12); from then on the curriculum takes about 25 hours a
week. **June is float** for interviews and the move around July, and the end may slip to Sun 27 Jun 2027.

### The shape of a week

- **Monday to Friday:** Read 60 to 90 minutes, Code 120 to 150, Review 30 (60 on Friday, for the whole
  challenge), Retrieve and log 15 to 20.
- **Saturday:** strand day, five hours, at most six: maths 1.5 h, measurement 1.5 h, reading 1 h,
  write-up 1 h.
- **Sunday:** off, every week, buffers included. Never a slip day.
- **From Wed 10 Feb 2027** the Wednesday Read block becomes 90 minutes of interview preparation.

That plans 25 to 30 of your 35 hours; the rest is slack for slips and Friday stretch goals. Stretch goals
happen only on a Friday after the gate has passed, or in a buffer.

### Buffer weeks

A buffer absorbs slip first; any time left goes to its own list, never to the next challenge. **An unused
buffer is a success.**

- **Buffer A, 21 to 27 Dec 2026**, about half a week over Christmas: open milestones; two lldb sessions
  on addresses, reallocation and destructors, where you meet pointers; the Phase 1 write-up. Fri 1 Jan
  2027 is off too.
- **Buffer B, 8 to 14 Feb 2027**, 10 hours of model literacy: draw one transformer block; work out every
  tensor shape of a SmolLM2-135M block in `docs/model/shapes.md`; read the reference model code; run
  `tools/dump_reference.py` against your table; write a NumPy forward pass of one block that matches it
  within 1e-4, the oracle for week 16. Confirm the Phase 4 model on Sat 13 Feb. At most two days of
  capstone overflow. If time: a first CV draft and the AVX2 stretch.
- **Buffer C, 29 Mar to 4 Apr 2027**, 16 hours: the Phase 4 gate, its write-up and the LinkedIn post by
  Sat 3 Apr; the CV and a one-page portfolio summary; a day of interview questions; the first
  applications from Thu 1 Apr. If time: a first README story, the broadcast conformance case and the
  conformance-table script.
- **Buffer D, 3 to 9 May 2027:** the Phase 5 gate and write-up.

### Slip rules

Check milestones on Wednesday evening. First move stretch goals out, then move one non-gate requirement
to stretch, in writing. Overflow goes to the next buffer. If a phase has spent its buffer, it drops its
named item, at most one per phase. For Phases 1 to 5 in order: Tetris's hold and ghost piece; the
percentile calibration variant; parallel Boids; the per-layer calibration plot, then sampling beyond
temperature, then the 8-thread column; the Metal fallback. The Sun 28 Mar 2027 deadline never moves, and
a missing strand deliverable never blocks a gate.

---

## 4. Phase 1: language core through terminal games (weeks 1 to 5)

**Goal:** fluency in the 30% of C++ that 90% of inference code uses, with something moving on screen
every week. Life takes two weeks because the Week 1 book is two weeks of Read blocks.

**Strands** (Saturday):

| Week | Maths | Measure | Reading |
|---|---|---|---|
| 1 | the book's clock face and flat index | Debug vs Release at 1000×1000, predicted first; `wrap` in Compiler Explorer | book |
| 2 | Hz and ms per frame, 20 minutes | ms per step vs grid size; did the step loop vectorise? | book |
| 3 | 10,000 random draws vs the expected count, 45 minutes | the direction `switch`: jump table or compare chain? | none |
| 4 | 2×2 matrices as transformations (3Blue1Brown linear algebra 1 to 4); Tetris rotations on paper | lookup-table vs computed rotation; a `Vec2` in registers | none |
| 5 | distributions, inverse-CDF sampling, expected value, temperature, top-k, top-p (Seeing Theory 1 to 3) | a sort with a lambda vs a function pointer: inlined? | rubric checkpoint 1, Sat 12 Dec |

### Weeks 1 and 2: Game of Life in the terminal (Mon 9 Nov to Sun 22 Nov 2026)

A toroidal grid, ANSI redraw, configurable size and seed. Week 1: chapters 0 to 10 and milestones M1 to
M4, with all 13 doctest cases green. Week 2: chapters 11 to 14, M5 to M7, BENCH.md, the review on Fri 20
Nov and the write-up on Sat 21 Nov. If the gate passes by Wed 18 Nov, the rest of week 2 is stretch goals
and the Snake spec ritual.

- **Learn:** the compilation model, headers vs sources, `int`, `size_t`, `bool`, `std::vector`, flat 2D
  indexing, functions, `const`, references, `std::string`, chrono, CMake, doctest, reading a CI run.
- **Twin:** a tensor is a flat array plus a shape; the Life step is a 3×3 stencil; double buffering is
  ping-pong buffers.
- **Stretch:** a 1000×1000 grid timed from the game; patterns; colours by cell age.

### Week 3: Snake (Mon 23 Nov to Sun 29 Nov 2026)

Raw-mode input, a growing body, speed-up, score. lldb is taught on Tue 24 Nov in a 75-minute Read block,
on a `scratch/` toy that walks off a vector: breakpoints, stepping, printing a vector and a deque,
conditional breakpoints, the backtrace, and the week 1 tests under ASan. One blocker this week is solved
with lldb, and the log names the command.

- **Learn:** `struct`, `enum class`, `std::deque`, scope and lifetime, RAII via a guard that restores the
  terminal, `switch`, by-reference vs by-value, `std::optional` for "no key pressed", lldb.
- **Twin:** the game loop is a decode loop: one update per tick on a fixed time budget.
- **Stretch:** record replays to a file.

### Week 4: Tetris (Mon 30 Nov to Sun 6 Dec 2026)

Seven pieces, rotation, line clear, hold and a ghost piece.

- **Learn:** classes with invariants, constructors and destructors, nested `std::array` vs flat arrays,
  copy and move, operator overloading for a tiny `Vec2`, `static`, header-only vs compiled.
- **Twin:** rotation is a 2×2 matrix multiply, and transpose and flip are tensor ops; in week 16 the same
  rotation on pairs of dimensions is RoPE.
- **Stretch:** rotation by lookup table vs computed, measured.

### Week 5: Roguelike slice (Mon 7 Dec to Sun 13 Dec 2026)

Rooms and corridors, monsters that pathfind with BFS, weighted loot tables.

- **Learn:** iterators, `<algorithm>`, lambdas, `<random>` with `discrete_distribution`.
- **Twin:** weighted loot is token sampling with temperature, top-k and top-p, reused in week 18; BFS is
  graph traversal, as in ggml's compute graph.
- **Stretch:** A* with a bounded open set, which is beam search; a binary save file with a header.

> **Gate, Sat 12 Dec 2026:** every game plays; every challenge's doctests pass; BENCH.md for Life and
> Tetris has an Experiment section; CI is green; rubric checkpoint 1; write-up "What a grid taught me
> about tensors".

Pointers wait for Buffer A and week 10; inheritance, exceptions as control flow and threads wait longer.

---

## 5. Phase 2: memory and performance (weeks 6 to 10)

**Goal:** know where bytes live, how they move through caches, and what a number costs. Setup on Mon 14
Dec: the arm64 container with LLVM 20, checked on `std::jthread`, `std::mdspan` and `std::print`, and
the Python venv (PyTorch, NumPy, safetensors, onnx, tokenisers). **Entry check:** rubric checkpoint 1.

| Week | Maths | Measure | Reading (model literacy) |
|---|---|---|---|
| 6 | velocity, Euler steps, the dot product as projection | predict the SoA speed-up; first CPU Counters run | ML 1: a layer is a matmul plus a non-linearity (3Blue1Brown NN 1, 2); model bytes at fp32, int8 and 4-bit; Drepper 3.1 to 3.3 |
| 7 (A) | none | the two lldb sessions | ML 2: attention on paper (The Illustrated Transformer), one head by hand |
| 8 | cosine similarity, N² pairs, big-O as counting | N² vs grid at three sizes | ML 3: tokens, embeddings, logits, the residual stream |
| 9 | IEEE 754 fields, ulp, cancellation, quantisation noise; a block's Q8 error by hand | fp32 vs int8 update | ML 4: what a KV cache stores, and its bytes at 1,024 tokens |
| 10 | calibration choices; page and offset as division and remainder | allocation in a loop vs a pool | Wu et al. (2020) on integer quantisation; ggml's `block_q8_0` beside your structs |

### Week 6: Particle system (Mon 14 Dec to Sun 20 Dec 2026)

100k particles with gravity, wind and walls, drawn as braille density.

- **Learn:** AoS vs SoA, cache lines, `alignas`, Google Benchmark, Instruments counters, cachegrind,
  `reserve`, optimisation levels, `std::function`.
- **Twin:** weights are laid out for the access pattern; memory bandwidth, not FLOPs, bounds most of
  inference.
- **Stretch:** hot/cold splitting, measured.

### Week 7: Buffer A (Mon 21 Dec to Sun 27 Dec 2026)

See section 3.

### Week 8: Boids (Mon 28 Dec 2026 to Sun 3 Jan 2027; Fri 1 Jan off)

5k flocking agents.

- **Learn:** templates and concepts (a generic `Grid<T>`), `std::function` vs templates, N² search →
  spatial grid → sorted cell lists, `std::ranges`.
- **Twin:** attention is all-pairs; spatial hashing is the idea behind sliding-window and block-sparse
  attention.
- **Stretch:** N² vs grid vs k-d tree at 1k, 5k and 20k agents, plotted.

### Week 9: Numbers (Mon 4 Jan to Sun 10 Jan 2027)

A fixed-point library, then particle positions quantised three ways while the game still plays: Q8_0 and
Q4_0 blocks as llama.cpp stores them, and affine int8 with a scale and zero point, per-tensor and
per-channel, accumulated in int32 and requantised with a fixed-point multiplier.

- **Learn:** bit manipulation, `std::bit_cast`, IEEE 754 by hand, fp16 and bf16 conversion (week 17
  needs both), overflow and UB, `constexpr`, testing numerical error, one min-max vs percentile
  calibration experiment.
- **Twin:** llama.cpp quantises weights in blocks and activations at run time; edge accelerators quantise
  activations statically from calibration data. You learn both vocabularies.
- **Stretch:** Q4_K-style super-blocks.

### Week 10: Paged entity store (Mon 11 Jan to Sun 17 Jan 2027)

Entities in fixed-size pages behind a page table: 10k spawns and despawns a second, no fragmentation.

- **Learn:** pointers as handles, `unique_ptr` with custom deleters, `shared_ptr` and when to use
  neither, arenas and pools, placement `new`, move semantics and the rule of five.
- **Twin:** PagedAttention and the llama.cpp KV cache: per-sequence pages behind a block table.
- **Stretch:** copy-on-write page sharing, which is prefix caching.

> **Gate, Sat 16 Jan 2027:** 100k particles at 60 fps with the AoS → SoA → aligned → `-march=native`
> history in BENCH.md; the quantiser's mean and max error for Q8_0, Q4_0 and per-channel int8, with the
> calibration experiment; four notes in `docs/model/`; write-up "Quantisation is just a loot table for
> bytes".

---

## 6. Phase 3: parallelism, SIMD and the capstone game (weeks 11 to 14)

**Goal:** use every core and vector lane, know from measurement when it helps, and ship your first
portfolio piece. **Entry check** Mon 18 Jan, 30 minutes cold, on SoA, float fields, Q8 error, page
arithmetic and projection; two misses start the phase on Tuesday.

| Week | Maths | Measure | Reading |
|---|---|---|---|
| 11 | Amdahl's law, predicted vs measured speed-up | a TSan report in the debugger; atomic vs mutex | the roofline paper (Williams, Waterman and Patterson, 2009) |
| 12 | arithmetic intensity, log-log axes, the order of float additions | NEON vs auto-vectorised; peaks predicted from documents | NEON intrinsics; ggml's dot kernel; the M5's bandwidth, about 153 GB/s, to check |
| 13 | none | branches per cell in the hottest sand rule | Karpathy's "Let's build GPT", first hour |
| 14 (B) | matmul as dot products; strides; 2mnk flops | the stencil at `-O2` vs `-O3` | the second hour; `shapes.md`; rubric checkpoint 2, Sat 13 Feb |

### Week 11: Job system (Mon 18 Jan to Sun 24 Jan 2027)

A thread pool that updates particles and Boids in parallel chunks.

- **Learn:** `std::thread`, `std::jthread`, mutexes, condition variables, atomics, acquire and release,
  false sharing, `std::barrier`, TSan.
- **Twin:** llama.cpp splits tensor rows across a thread pool, with a barrier per op.
- **Stretch:** work stealing; scaling to 10 threads, with the knees at 4 and 10 explained.

### Week 12: SIMD and the roofline (Mon 25 Jan to Sun 31 Jan 2027)

Monday to Wednesday: NEON versions of the particle update, a dot product and the Q8 dequant-dot, behind
one interface with a scalar fallback. Thursday and Friday: a roofline suite for peak FLOPs and bandwidth,
with every kernel placed on it, per core class.

- **Learn:** intrinsics, `#ifdef` dispatch, horizontal reductions, vectorisation reports, benchmark
  methodology, arithmetic intensity. `-march=native` differs per machine; the container needs
  `-march=armv8.2-a+dotprod+i8mm`.
- **Twin:** ggml's `vec_dot_q8_0` is this kernel; decode is memory-bound and prefill compute-bound.
- **Stretch, in order:** AVX2 versions proved on the x86 runner; an int8 `vdotq_s32` dot for week 20;
  cache bandwidth; x86 timings on rented bare metal.

### Week 13: Capstone, falling-sand game (Mon 1 Feb to Sun 7 Feb 2027)

Sand, water and fire on a 400×200 grid, threaded, with NEON on the hot stencil; a release workflow, an
arm64 Linux build, a grid × threads × fps table and a 10-second GIF. Stretch: steam, plants, acid, FTXUI
brushes, save and load, dirty rectangles.

- **Learn:** structuring a 2,000-line program, module boundaries, release engineering.
- **Twin:** a stencil with data-dependent branches, the hardest kind to make fast; you port it to CUDA in
  week 22.

### Week 14: Buffer B (Mon 8 Feb to Sun 14 Feb 2027)

See section 3. Interview preparation starts on Wed 10 Feb.

> **Gate, Sat 13 Feb 2027:** the capstone tagged and public, CI green on three runners, an arm64 build and
> a benchmark table; the M5 roofline with every kernel on both core classes; `shapes.md` and the reference
> dump working; rubric checkpoint 2; write-up "My laptop's roofline, and where my kernels sit on it". From
> here the repo is presentable.

---

## 7. Phase 4: the pivot, tensor library and a small language model in C++ (weeks 15 to 21)

**Goal:** your own quantised LLM inference engine with no ML library, on the Mac and as an arm64 Linux
binary, plus the int8 calibration tooling an edge accelerator team runs. **Entry check** Mon 15 Feb:
rubric checkpoint 2 stands in.

**The model: SmolLM2-135M**, Llama architecture, Apache 2.0: 30 layers, hidden size 576, 9 query and 3 KV
heads, RMSNorm, RoPE, SwiGLU and tied embeddings; about 540 MB in fp32, with official GGUF files. Qwen2.5
and Llama 3.2 share its block, so the Phase 6 comparison with llama.cpp is like for like. GPT-2 124M is
the recorded fallback if model literacy has not landed by Sat 13 Feb. Token ids come from Python glue; a
byte-exact tokeniser is a week 29 option.

| Week | Maths | Measure | Reading; interview |
|---|---|---|---|
| 15 | strided indexing; transposes as swapped strides; broadcasting | the matmul at each stage | Goto and van de Geijn (2008); virtual dispatch |
| 16 | softmax as a distribution; RMSNorm; attention as an expected value; RoPE as rotation | softmax's cost; what `-ffast-math` changes | Attention Is All You Need, section 3; online softmax (2018); exceptions and `std::expected` |
| 17 | bf16 vs fp32 bits; a file as offsets and strides | mapped memory in the debugger | the GGUF spec; templates, enough to read ggml |
| 18 | log-probabilities, cross-entropy, perplexity | the three hot loops in Time Profiler | FlashAttention (2022); PagedAttention (2023); question list 1 |
| 19 | error propagation; per-channel scales and outliers | tokens/s predicted from bytes moved | GPTQ and AWQ; question list 2 |
| 20 | activation outliers; zero-point shifts | int8 kernel vs fp32 | ONNX Runtime's static quantisation; design questions; first mock interview Wed 24 Mar; rubric checkpoint 3, Sat 27 Mar |
| 21 (C) | none | none | mock interview 2, Wed 31 Mar |

### Week 15: Tensor library (Mon 15 Feb to Sun 21 Feb 2027)

A `Tensor` with shape, strides, copy-free views and broadcasting, and a matmul for any M: naive →
reordered → cache-blocked → threaded.

- **Learn:** `std::mdspan`, `std::span`, concepts, testing against PyTorch and ONNX Runtime dumps.
- **Reuses:** the week 1 grid, week 6 blocking, the week 11 pool, week 12 SIMD.
- **Stretch:** 50× over naive; within 3× of Accelerate.

### Week 16: Ops, as an op library with a conformance table (Mon 22 Feb to Sun 28 Feb 2027)

RMSNorm, RoPE with rotate-half pairing, SiLU and the gated MLP, grouped-query attention, softmax, tied
embeddings, the causal mask and residuals. Each op sits in a flat function-pointer table and is tested
against the Buffer B oracle under a written tolerance policy, with a non-contiguous case for matmul and
RMSNorm.

- **Learn:** numerical stability, fp32 accumulation, tolerance testing, function-pointer tables.
- **Twin:** a runtime is judged by its operator coverage, and accelerator vendors publish which ops run on
  the device and which fall back to the CPU. The README names the two silent traps: GQA grouping and RoPE
  pairing.
- **Stretch:** layernorm and GELU for the GPT-2 fallback; conv2d as im2col plus matmul; a fused
  RMSNorm-matmul.

### Week 17: Weight loading and the forward pass (Mon 1 Mar to Sun 7 Mar 2027)

Map the safetensors file into memory, convert bf16 to fp32, run 30 layers, and print the next token for
"The history of Islamabad". On Fri 5 Mar, build an arm64 Linux binary in the container with
`-march=armv8-a`, runtime-checked dotprod kernels and static C++ libraries; its size and start-up time go
in the README.

- **Learn:** binary formats, mmap and page faults, endianness, `std::string_view`, `std::expected`,
  `unordered_map`, runtime feature dispatch.
- **Stretch:** your own GGUF-like file format; a fully static musl build.

### Week 18: Generation (Mon 8 Mar to Sun 14 Mar 2027)

A KV cache on the week 10 page table, the autoregressive loop, week 5 sampling and streaming output, with
prefill and decode tokens/s. Batched decode of up to 4 sequences only if Wednesday shows the week on time.

- **Learn:** profiling a real program, flame graphs, amortising allocations.
- **Stretch:** continuous batching. Speculative decoding is read in week 24, not built.

### Week 19: Quantised inference, llama.cpp style (Mon 15 Mar to Sun 21 Mar 2027)

Q8_0 weights with dequant-on-the-fly dot kernels, and perplexity for fp32 and Q8_0 on a fixed public text
at a fixed context. The block format matches llama.cpp's, so Phase 6 compares like for like.

- **Learn:** template specialisation per quant type, `if constexpr`, accuracy vs speed trade-offs.
- **Stretch:** Q4_0. Q4_K is out of Phase 4.

### Week 20: Static int8 inference with calibration, edge-accelerator style (Mon 22 Mar to Sun 28 Mar 2027)

This week ends on the deadline that never moves, so the must list is short: min-max calibration over a
fixed set of 32 sequences of 256 tokens, with per-channel symmetric weights and per-tensor asymmetric activations (the
TFLite int8 scheme); one int8 × int8 kernel with int32 accumulation and saturating requantisation; W8A8
perplexity beside fp32 and Q8_0; a `calibrate` subcommand that writes per-layer scales; and a one-page
report, with a table and a per-layer error plot, explaining why per-tensor W8A8 loses to Q8_0.

- **Twin:** the quantise-then-compile flow of edge SDKs such as Axelera's Voyager and NXP's eIQ.
- **Stretch, in order, only if green by Thu 25 Mar:** percentile calibration; ONNX Runtime's static
  quantisation as a second baseline; the week 12 dotprod kernel; SmoothQuant scaling; Python bindings.

### Week 21: Buffer C (Mon 29 Mar to Sun 4 Apr 2027)

See section 3. Applications go out from Thu 1 Apr.

> **Gate, Sat 3 Apr 2027:** `./slm --prompt "The history of Islamabad"` writes coherent text on the Mac
> and in the arm64 container; a README table of tokens/s for fp32, Q8_0 and W8A8 at 1, 4 and 8 threads,
> with perplexity for each; the conformance table and the calibration report; rubric checkpoint 3; the
> write-up "I wrote a small-language-model inference engine in C++, from a particle system" and its
> LinkedIn post. If the phase slips, apply on 1 Apr with the forward pass and finish the rest in April.

---

## 8. Phase 5: GPU kernels and backends (weeks 22 to 26)

**Goal:** the kernel types an inference backend is made of, each benchmarked against the vendor library,
and a backend abstraction that runs the model on the CPU, on your CUDA kernels and on a simulated
accelerator. About 25 hours a week beside applications, on a rented 4090. In the first hour on Mon 5 Apr,
test whether the pod allows Nsight Compute; if not, measure with `cudaEvent` timings and bytes moved.
**Entry check** Mon 5 Apr on softmax, perplexity, why decode is memory-bound, online softmax and the Q4
layout. **Decision point, Sat 17 Apr:** if interviews or the budget squeeze the plan, finish matmul and
attention only, port the rest to Metal, and keep week 25.

| Week | Maths | Measure | Reading |
|---|---|---|---|
| 22 | occupancy | the Life kernel's PTX; compute-sanitizer | the Nsight Systems docs; ggml-cuda's stencils |
| 23 | bytes per tile vs reuse | the tiled speed-up, predicted from bytes | FlashAttention-2 (2023) |
| 24 | the algebra of online softmax | the matvec's shared-memory loads | ggml-cuda's quantised matvec; Orca (2022); speculative decoding (2023) |
| 25 | none | offload ratio and DMA bytes per token | TVM's "Bring Your Own Codegen"; the MLIR Toy tutorial, chapters 1 to 3 |

Every Wednesday brings a 45-minute mock interview and a timed whiteboard problem.

### Week 22: Life and reductions on the GPU (Mon 5 Apr to Sun 11 Apr 2027)

Port Life and stream its frames over SSH; then sum, max and argmax with warp shuffles.

- **Learn:** host and device memory, launches, grids and blocks, shared memory for the halo, `cudaEvent`
  timing, nvcc with CMake, `__shfl_down_sync`.
- **Twin:** every elementwise and stencil op in ggml-cuda is this kernel with a different body.
- **Stretch:** the falling-sand port; Life as a Metal shader on unified memory.

### Week 23: Matmul (Mon 12 Apr to Sun 18 Apr 2027)

Naive → tiled → register-tiled → vectorised, from 576 to 4096 square, against cuBLAS on the same card.

- **Learn:** tiling, coalescing, register pressure, occupancy, templated tile sizes.
- **Twin:** the kernel every engine lives or dies by.
- **Stretch:** fp16 tensor cores via `wmma`.

### Week 24: Attention, softmax, RMSNorm and quantised matvec (Mon 19 Apr to Sun 25 Apr 2027)

Row-wise softmax and RMSNorm; fused attention with online softmax over key tiles; a dequant-on-the-fly Q8
matvec for decode.

- **Learn:** fusion to avoid memory round trips, `__half` and `half2`, separate prefill and decode
  kernels.
- **Twin:** a flash-attention-lite and ggml-cuda's `mul_mat_vec_q`, built by you.
- **Stretch:** a paged KV cache on the device.

### Week 25: Backends: cpu, cuda and a simulated accelerator (Mon 26 Apr to Sun 2 May 2027)

A ggml-backend-shaped interface: buffer types, a per-op `supports_op` query, graph splitting with CPU
fallback, and function-table dispatch. Three backends: cpu; cuda, with the weights and KV cache on the
device; and `npu-sim`, a fake device that runs only int8 matmul, add, RMSNorm and SiLU in a fixed 4 MB
local memory, with explicit DMA and a cost model. The scheduler reports the offload ratio, DMA bytes per
token and modelled time. The simulator runs on the Mac, so the week survives a GPU slip.

- **Learn:** abstraction without virtual-call cost, streams, overlapping copies, memory planning.
- **Twin:** ggml-backend, ONNX Runtime's execution providers, and the core runtime problem at an
  accelerator company.
- **Stretch:** a Metal backend, proving the abstraction has no CUDA assumptions.

### Week 26: Buffer D (Mon 3 May to Sun 9 May 2027)

See section 3.

> **Gate, Sat 8 May 2027:** `./slm --backend cuda` generates text on your kernels; `--backend npu-sim`
> generates the same text with attention on the CPU and a DMA report; matmul vs cuBLAS at four sizes;
> CPU vs GPU tokens/s; write-up "From falling sand to flash attention: four CUDA kernels and a fake
> accelerator".

---

## 9. Phase 6: llama.cpp, ggml, contribution and the public record (weeks 27 to 30)

**Goal:** read the real thing with full comprehension, leave a mark on it, and package seven months of
work for a five-minute read. **Entry check** Mon 10 May: rubric items 8 to 13, cold. Saturdays measure a
ggml `vec_dot` in Compiler Explorer, llama.cpp against your engine, and your contribution's before and
after; the Wednesday mock interviews continue, and rubric checkpoint 4 is on Sat 15 May.

### Week 27: Read ggml (Mon 10 May to Sun 16 May 2027)

The tensor struct, the compute graph, the quantisation block formats, the arm64 `vec_dot` kernels, the
thread pool, ggml-backend and ggml-alloc, each mapped to your own code from weeks 9, 11, 12, 15 and 25.
Output: `phase6/ggml-notes.md`, with "my equivalent" links and three things ggml does better.

### Week 28: Read llama.cpp, vLLM and ONNX Runtime's int8 path (Mon 17 May to Sun 23 May 2027)

`llama_decode`, batching, the KV cache, sampling, GGUF loading and the server's continuous batching; then
vLLM v0.6.3's scheduler, block manager and paged-attention kernel, diffed against main; then ONNX
Runtime's int8 GEMM. Output: `phase6/llamacpp-notes.md`, a page mapping PagedAttention onto your week 10
page table, and llama.cpp on the official SmolLM2-135M Q8_0 GGUF timed against your engine. You will lose
on speed; the write-up says where and why.

### Week 29: Contribute (Mon 24 May to Sun 30 May 2027)

One of: a good first issue in ggml or llama.cpp; an arm64 or Metal kernel optimisation with a benchmark;
a GGUF or quantisation tool, such as a byte-exact tokeniser; or a published quant-format benchmark
harness. Output: a merged PR, or a released tool with numbers.

### Week 30: Package (Mon 31 May to Sun 6 Jun 2027)

The README as a story: the arc, the benchmark table, the best three write-ups, a sand GIF and a recording
of the engine. LinkedIn and the CV updated; unfinished phases marked "in progress".

> **End-of-curriculum gate, Sat 5 Jun 2027:** a PR or tool release; the README tells the whole story;
> three write-ups published, on performance, inference, and GPU and backends. You can explain any line of
> ggml's quantised dot product and say what you would change.

---

## 10. The strands, and what proficient means

Six strands, about 115 hours in all, never in the Code block:

| Strand | Slot | Deliverable | Hours |
|---|---|---|---|
| **Maths intuition** | Saturday, 1.5 h from week 4 | One hand computation a week, checked against that week's program | about 22 |
| **Measurement** | Saturday, 1.5 h from week 1 | An Experiment in every BENCH.md: a prediction first, then the measurement with machine, core class and flags, then two sentences of explanation; one Compiler Explorer paste a week; debugger checkpoints in weeks 3, 7, 11, 17 and 22 | about 26 |
| **Model literacy** | The Saturday reading hour, weeks 6 to 14, plus Buffer B | Notes in `docs/model/`, `shapes.md` and the NumPy forward pass; in weeks 10 to 13 it shares the hour with papers, so the second reading is "if time" | about 18 |
| **Reading** | The Saturday reading hour, weeks 10 to 25 | One note per paper in `docs/papers/`: the claim, the key figure redrawn, what you built that it maps to, a number to check, an interview question | about 16 |
| **Interview preparation** | The Wednesday Read block from Wed 10 Feb 2027; weekly mock interviews from Wed 24 Mar | Six skipped-topic sessions on toys in `scratch/`, the two question lists, design questions, mock transcripts in `docs/interviews/`, the CV | about 25 |
| **Proficiency rubric** | Sat 12 Dec 2026, 13 Feb, 27 Mar and 15 May 2027 | Each item below dated, with a link to evidence | 8 |

The two question lists: **list 1** is the rule of zero and five, copy elision, `std::move`, the ODR,
undefined behaviour, virtual destructors, slicing and dangling references; **list 2** is iterator
invalidation, the small-string optimisation, alignment, placement new, strict aliasing, `volatile` vs
atomic, the memory model and data races.

### What proficient means

Check yourself cold, without the book or Claude.

- **Write:** (1) a 300-line program with tests, free of warnings and sanitizer reports, in a day; (2) the
  right parameter type, with reasons; (3) a class with an invariant and only the special members it
  needs; (4) RAII for a non-memory resource; (5) `unique_ptr`, `shared_ptr` and raw pointers used
  correctly; (6) a constrained template, and a NEON dot checked against scalar; (7) a CMake project with
  tests and sanitizers in 15 minutes.
- **Explain:** (8) what the compiler and linker do, and fix ODR and undefined-symbol errors; (9) IEEE 754,
  Q8 and Q4 error, fp32 accumulation and zero points; (10) acquire and release, and a data race; (11) why
  inference code avoids virtual dispatch and exceptions; (12) both question lists; (13) any owned
  CONCEPTS.md row.
- **Measure and debug:** (14) predict a loop's time within 2× from cache and bandwidth, then measure it;
  (15) read `-O2` assembly for vectorisation and the hot instruction; (16) fix a bug from a sanitizer
  report; (17) drive lldb, threads included; (18) read 1,000 lines of ggml and draw its data structures.

**Expected state:** by 12 Dec, items 1, 2, 4, 7, 8, 16 and 17 with the book open; by 13 Feb, items 1 to
10 and 13 to 17 cold; by 27 Mar, all but 18 cold; by 15 May, all eighteen. **Proficient enough to apply**
means the 27 Mar state plus 80% of the week 1 to 20 CONCEPTS.md rows owned. If fewer than fourteen items
are cold on 27 Mar, you still apply on 1 Apr, and the gaps become the interview agenda.

---

## 11. Concept index (frozen seed; CONCEPTS.md is live)

**`CONCEPTS.md` is the live concept graph**, re-keyed to this revision's weeks with Maths, Model and
Interview areas added. The table below is the seed it grew from on 7 Nov 2026, kept for the record and
not edited again; where the two disagree, CONCEPTS.md is right, and a week's README cites CONCEPTS.md
rows, never this table.

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
hierarchies, exceptions as control flow, template metaprogramming beyond `if constexpr` and concepts,
Boost, Qt, coroutines and modules. Interviews ask about them, so the interview strand covers them in
weeks 15 to 20 on toy problems.

---

## 12. Evidence trail

**By Sun 28 Mar 2027, public, ready for applications on Thu 1 Apr:** CI since week 1 on three runners;
four games with tests and benchmarks; the quantiser's error numbers and a calibration experiment; NEON
kernels and the M5 roofline; the released capstone for macOS and arm64 Linux; the CPU engine as Mac and
arm64 binaries with tokens/s, perplexity, the conformance table and the calibration report; three phase
write-ups and a drafted LinkedIn post, published by Sat 3 Apr; a CV and a portfolio summary; the rubric,
and about eleven paper notes.

| By | Artefact | Proves |
|---|---|---|
| Sun 13 Dec 2026 | Four games, tests, CI, first write-up | Idiomatic modern C++ from scratch |
| Sun 17 Jan 2027 | The AoS → SoA history; quantiser error for Q8_0, Q4_0 and int8 | You think in cache lines, bytes and zero points |
| Sun 14 Feb 2027 | Capstone release, arm64 build, roofline | You ship, measure and target Arm Linux |
| Sun 28 Mar 2027 | Engine README with tokens/s and perplexity; conformance table; calibration report | You understand inference, operator coverage and int8 calibration |
| Sun 9 May 2027 | CUDA backend, matmul vs cuBLAS, the simulated accelerator | GPU kernels, and the shape of a restricted-op runtime |
| Sun 6 Jun 2027 | PR or tool, the llama.cpp comparison, three write-ups | You work in a real codebase and explain it |

Runtime and kernels teams read the roofline, the arm64 row and the backends write-up; quantisation and SDK
teams read the calibration report and the conformance table. For Innatera, the transferable parts are the
embedded runtime, SDK and quantisation work; spiking networks are not covered.

---

## 13. Open decisions and what the methodology doc covers

**Settled on 7 Nov 2026:**

- [x] **GPU:** rented Nvidia, with USD 400 to 500 from January 2027. Estimated spend is USD 150 to 400:
  USD 30 to 55 for the 4090 hours, about USD 7 for a network volume (a stopped pod still bills its disk),
  USD 10 to 25 for an optional A100 or H100 session, EUR 30 to 70 for an optional bare-metal month, EUR
  110 to 130 for an optional Pi 5, and USD 100 to 150 in reserve for a second attempt at a kernel.
- [x] **Linux container:** OrbStack, arm64 Ubuntu 24.04 with LLVM 20, from 14 Dec 2026.
- [x] **Public from day one**, with commits under your GitHub noreply address.

**Decided in this revision; say by Mon 9 Nov 2026 if you disagree:**

- [x] **Phase 4 model:** SmolLM2-135M, with GPT-2 as the fallback, confirmed on 13 Feb 2027.
- [x] **Rest day:** Sunday. **Day one:** Mon 9 Nov 2026, which you confirmed.

**Still open:**

- [ ] **A Raspberry Pi 5** from about 11 Jan 2027, as a real arm64 edge board with working counters.
  Recommended if the budget allows.
- [ ] **Bare-metal x86 for a month** for the week 12 stretch. Open the account in week 11, because it
  needs identity checks.
- [ ] **Days off over Christmas.** Buffer A assumes half a week of work; two full weeks off turns Boids
  into a buffer and trims the capstone, never Phase 4.
- [ ] **Other days off from February to April 2027.** List them in the log before their week; a buffer
  absorbs up to three days.
- [ ] **Which team first:** runtime and kernels, quantisation tooling, or SDK and deployment. Check the
  plan against real postings before Buffer B.
- [ ] **GPU-cloud serving** as a real second target. If yes, the A100 session and FlashAttention-2 become
  required.

How a week runs in detail, from the daily blocks and the spec ritual to reviews, retrieval, the log,
reference implementations and slips, lives in `docs/methodology.md`. Every file this revision affected was
brought in line on 7 Nov 2026.

---

## 14. Changelog

**2026-11-07: revision after the first audit.** Retargeted at small-model inference on edge and CPU for
Dutch accelerator employers, with serving read in vLLM. Re-timed to 30 ISO weeks with four buffers,
Sundays off, Saturday strands and applications from 1 Apr 2027. Fixed the hardware assumptions: the
container is arm64, counters come from Instruments, and AVX2 is a stretch. Added six strands and a
proficiency rubric. Switched Phase 4 to SmolLM2-135M and added an op library, int8 calibration and a
simulated-accelerator backend; cut Q4_K, speculative decoding, cudaGraph and multi-GPU. Gave Life two
weeks, taught lldb in week 3, started CI in week 1, and made CONCEPTS.md the live concept graph.
Published the repository and the book.

**2026-11-07 (later): trimmed to about half its length.** Detail was cut; no decision, date, gate or
must item changed.
