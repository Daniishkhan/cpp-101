# CONCEPTS.md: the concept graph

Every C++, maths, model and inference concept in the curriculum, where it is first taught, where it comes
back, and whether you own it yet. This file is the **live concept graph**. It was seeded on 7 Nov 2026
from the concept index in [goal.md](goal.md) section 11; that index is a frozen seed, kept for the record
and never edited again, and where the two disagree this file is right. Week numbers follow the 7 Nov 2026
revision of goal.md: 30 weeks, 26 challenge weeks plus four buffers (Buffer A = week 7, B = 14, C = 21,
D = 26). When a week's challenge is planned, its README must cite which rows it **introduces** and which
it **reuses**, and this file is updated in the same commit.

Use it for spaced retrieval: once a week, pick five rows marked `owned` at random and explain each one
out loud in two sentences without opening the code (see [docs/methodology.md](docs/methodology.md)).

**Status values:** `planned` (not yet reached), `in progress` (being taught this week), `owned` (used
correctly in a challenge and explained in a review), `rusty` (failed a retrieval check; revisit).

Life rows (weeks 1 and 2) link to the chapter of the [Week 1 book](docs/book/week1/index.html) that
teaches them.

## Language core

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| What a program is: CPU, memory, bytes, source to machine code | Language core | Weeks 1 and 2 / 01-life, [ch. 1](docs/book/week1/01-what-a-program-is.html) | every week | in progress |
| Reading a compiler error | Language core | Weeks 1 and 2 / 01-life, [ch. 1](docs/book/week1/01-what-a-program-is.html), [ch. 15](docs/book/week1/15-appendix.html) | every week | in progress |
| Values and types: `int`, `double`, `bool`, `char`, `size_t`, `uint8_t`, `sizeof` | Language core | Weeks 1 and 2 / 01-life, [ch. 2](docs/book/week1/02-values-and-types.html) | every week | in progress |
| `const` and `auto` | Language core | Weeks 1 and 2 / 01-life, [ch. 2](docs/book/week1/02-values-and-types.html), [ch. 5](docs/book/week1/05-references-and-const.html) | every week | in progress |
| Integer vs floating arithmetic, `static_cast`, signed/unsigned mixing | Language core | Weeks 1 and 2 / 01-life, [ch. 2](docs/book/week1/02-values-and-types.html) | week 9 (overflow, UB) | in progress |
| Control flow: `if`, `while`, `for`, nested loops | Language core | Weeks 1 and 2 / 01-life, [ch. 3](docs/book/week1/03-control-flow.html) | every week | in progress |
| Functions: parameters, return, declaration vs definition, scope, the call stack | Language core | Weeks 1 and 2 / 01-life, [ch. 4](docs/book/week1/04-functions.html) | every week | in progress |
| References `T&` and `const T&`, pass by value vs by reference | Language core | Weeks 1 and 2 / 01-life, [ch. 5](docs/book/week1/05-references-and-const.html) | week 3 (by-ref vs by-value in Snake), week 15 (`span`) | in progress |
| Value semantics (a vector copy is a copy) | Language core | Weeks 1 and 2 / 01-life, [ch. 5](docs/book/week1/05-references-and-const.html), [ch. 6](docs/book/week1/06-vector.html) | week 4 (copy and move) | in progress |
| Compilation model: headers, sources, translation units, the linker | Language core | Weeks 1 and 2 / 01-life, [ch. 10](docs/book/week1/10-headers-and-files.html) | week 4 (header-only vs compiled), week 13 (module boundaries of a 2 to 3k-line program) | in progress |
| `#pragma once`, `using Name = Type;` | Language core | Weeks 1 and 2 / 01-life, [ch. 7](docs/book/week1/07-flat-grid.html), [ch. 10](docs/book/week1/10-headers-and-files.html) | every week | in progress |
| `struct`, `enum class`, `switch` | Language core | Week 3 / 02-snake, [ch. 1](docs/book/week3/01-structs.html), [ch. 2](docs/book/week3/02-enum-class-and-switch.html) | weeks 4, 5, 13 | planned |
| Scope and lifetime, RAII (a guard that restores the terminal) | Language core | Week 3 / 02-snake, [ch. 7](docs/book/week3/07-lifetime-and-raii.html) | week 10 (RAII at scale), week 22 (device memory) | planned |
| `std::optional` for "no value" | Language core | Week 3 / 02-snake, [ch. 5](docs/book/week3/05-optional.html) | week 17 | planned |
| Classes with invariants, constructors, destructors | Language core | Week 4 / 03-tetris | weeks 10, 15 | planned |
| Copy and move, operator overloading (a tiny `Vec2`), `static` | Language core | Week 4 / 03-tetris | week 10 (rule of five), week 15 | planned |

## Standard library

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| `std::print` / `std::println` | Standard library | Weeks 1 and 2 / 01-life, [ch. 1](docs/book/week1/01-what-a-program-is.html) | every week | in progress |
| `std::vector`: size, `[]`, `.at()`, `push_back`, `resize`, `v(n, value)`, range-for | Standard library | Weeks 1 and 2 / 01-life, [ch. 6](docs/book/week1/06-vector.html) | every week | in progress |
| The `vector<bool>` trap (why `Cells` is `vector<uint8_t>`) | Standard library | Weeks 1 and 2 / 01-life, [ch. 6](docs/book/week1/06-vector.html) | week 9 (bit packing done right) | in progress |
| `std::swap` of two vectors | Standard library | Weeks 1 and 2 / 01-life, [ch. 7](docs/book/week1/07-flat-grid.html) | week 18 (KV cache buffers) | in progress |
| `std::string`: `+=`, `size`, `[]`, `to_string`, `stoi` | Standard library | Weeks 1 and 2 / 01-life, [ch. 8](docs/book/week1/08-strings-and-args.html) | week 17 (`string_view`, UTF-8) | in progress |
| `argc` / `argv`, parsing `--flags` | Standard library | Weeks 1 and 2 / 01-life, [ch. 8](docs/book/week1/08-strings-and-args.html) | every program from week 3 | in progress |
| `std::mt19937`, `uniform_real_distribution`, seeded randomness (minimal) | Standard library | Weeks 1 and 2 / 01-life, [ch. 8](docs/book/week1/08-strings-and-args.html) | week 5 (deep dive: `discrete_distribution`, sampling) | in progress |
| `std::chrono`: durations, `steady_clock`, `sleep_for` | Standard library | Weeks 1 and 2 / 01-life, [ch. 9](docs/book/week1/09-terminal.html), [ch. 13](docs/book/week1/13-timing-and-benchmark.html) | week 3 (frame budget), week 12 (benchmark methodology) | in progress |
| `std::deque` | Standard library | Week 3 / 02-snake, [ch. 4](docs/book/week3/04-deque.html) | | planned |
| `std::array` (nested vs flat) | Standard library | Week 4 / 03-tetris | week 12 | planned |
| Iterators, `<algorithm>` (sort, partial_sort, accumulate, transform), lambdas; `std::priority_queue` (A* stretch only) | Standard library | Week 5 / 04-roguelike | weeks 8, 15 | planned |
| `std::span<const float>` to pass views | Standard library | Week 15 / tensor | weeks 16 to 19 | planned |
| `<random>` in depth: `discrete_distribution`, temperature / top-k / top-p | Standard library | Week 5 / 04-roguelike | week 18 | planned |
| `std::ranges`, `std::function` vs templates (`std::function` first met in week 6 / particles) | Standard library | Week 8 / boids | week 15 | planned |
| `<bit>`, `std::bit_cast` | Standard library | Week 9 / numbers | weeks 19, 24 | planned |
| `std::mdspan`, strided views | Standard library | Week 15 / tensor | weeks 16 to 25 | planned |
| `std::string_view`, `unordered_map`, flat hash map | Standard library | Week 17 / loader | week 28 | planned |
| `std::expected` | Standard library | Week 17 / loader | week 25 | planned |

## The shapes that matter (grids, tensors, kernels)

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| Flat 2D indexing `y*width+x`, row-major order, strides | Inference | Weeks 1 and 2 / 01-life, [ch. 7](docs/book/week1/07-flat-grid.html) | week 4 (rotation), week 15 (tensor strides), week 22 (2D CUDA indexing) | in progress |
| Wrap-around with `%`, the negative-modulo trap | Inference | Weeks 1 and 2 / 01-life, [ch. 7](docs/book/week1/07-flat-grid.html) | week 10 (page and offset as division and remainder), week 18 (KV cache positions) | in progress |
| A tensor is a flat array plus a shape | Inference | Weeks 1 and 2 / 01-life, [ch. 7](docs/book/week1/07-flat-grid.html) | week 15 | in progress |
| The 3x3 stencil: neighbour sums as a kernel | Inference | Weeks 1 and 2 / 01-life, [ch. 7](docs/book/week1/07-flat-grid.html), [ch. 14](docs/book/week1/14-build-life.html) | week 13 (falling sand), week 16 (conv2d as im2col, stretch), week 22 (CUDA stencil, shared-memory halo) | in progress |
| Double buffering (ping-pong buffers), one-dimensional automaton first | Inference | Weeks 1 and 2 / 01-life, [ch. 7](docs/book/week1/07-flat-grid.html) | week 13, week 22 | in progress |
| The game loop as a decode loop (fixed time budget per tick) | Inference | Weeks 1 and 2 / 01-life, [ch. 3](docs/book/week1/03-control-flow.html), [ch. 9](docs/book/week1/09-terminal.html); deepened week 3 | week 18 (autoregressive loop) | in progress |
| Matrix rotation, transpose and flip as tensor ops | Inference | Week 4 / 03-tetris | week 15, week 16 (RoPE is the same rotation on dimension pairs) | planned |
| Weighted sampling: temperature, top-k, top-p; A* as beam search (stretch) | Inference | Week 5 / 04-roguelike | week 18 | planned |
| Matmul: naive, loop-reordered, blocked, threaded; SIMD as stretch; arbitrary M for prefill and batched decode | Inference | Week 15 / tensor | weeks 19, 23 | planned |
| Softmax, RMSNorm, RoPE, SwiGLU, grouped-query attention, embeddings (tied), causal mask; layernorm and GELU as stretch | Inference | Week 16 / ops | weeks 17, 18, 24 | planned |
| Operator coverage and conformance against an oracle, tolerance policy (absolute plus relative, per dtype) | Inference | Week 16 / ops | weeks 19, 20, 25 (`supports_op`), 28 | planned |
| BPE tokenisation (token ids come from Python glue in `tools/` throughout Phase 4) | Inference | Week 29 (contribution option) | week 28 (llama.cpp's tokeniser, read) | planned |
| KV cache, paged KV, prefill vs decode | Inference | Week 18 / generation | weeks 24, 28 | planned |
| Quantised dot products (Q8_0, Q4_0), dequant-on-the-fly | Inference | Week 19 / quantised inference | weeks 24, 27 | planned |
| ONNX and GGUF as interchange formats | Inference | Weeks 15 to 17 (ONNX export as oracle), 19 (GGUF comparison) | week 28 (reading GGUF loading, ONNX Runtime's int8 path) | planned |
| Backend abstraction, graph splitting, CPU fallback, simulated accelerator (`npu-sim`), offload ratio and DMA bytes per token | Inference / CUDA | Week 25 / backends | weeks 27 (ggml-backend, ggml-alloc), 28 (execution providers) | planned |
| Continuous batching and the vLLM scheduler (read, not built; a sequence joining mid-decode is a week 18 stretch) | Inference | Week 28 / read llama.cpp | | planned |

## Systems

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| stdout, flushing, ANSI escape codes, redrawing in place, cursor show/hide | Systems | Weeks 1 and 2 / 01-life, [ch. 9](docs/book/week1/09-terminal.html) | weeks 3 to 6 and 13: raw ANSI throughout; FTXUI is optional in the week 13 capstone only | in progress |
| CMake and Ninja: configure, build, Debug vs Release | Systems | Weeks 1 and 2 / 01-life, [ch. 11](docs/book/week1/11-cmake.html) | every week | in progress |
| Sanitizers (ASan, UBSan) in Debug builds | Systems | Weeks 1 and 2 / 01-life, [ch. 11](docs/book/week1/11-cmake.html) | every week; ThreadSanitizer week 11 | in progress |
| Unit testing with doctest: `TEST_CASE`, `CHECK`, red to green | Systems | Weeks 1 and 2 / 01-life, [ch. 12](docs/book/week1/12-testing.html) | every week | in progress |
| CI with GitHub Actions | Systems | Weeks 1 and 2 / 01-life (macOS runner) | three runners from week 6, release workflow week 13, weeks 29 and 30 (the public record) | in progress |
| Raw terminal mode and keyboard input | Systems | Week 3 / 02-snake, [ch. 7](docs/book/week3/07-lifetime-and-raii.html), [ch. 8](docs/book/week3/08-keys-and-the-loop.html) | weeks 4 to 6, 13 | planned |
| Signals: Ctrl-C as `SIGINT`, a handler that only sets a `volatile std::sig_atomic_t` flag, why a killed program runs no destructors | Systems | Week 3 / 02-snake, [ch. 7](docs/book/week3/07-lifetime-and-raii.html) | weeks 4 to 6, 13 (every raw-mode game) | planned |
| Debugger (lldb / gdb): breakpoints, step over and into, conditional breakpoints, backtrace, tests under lldb with ASan | Systems | Week 3 / 02-snake (Tue 24 Nov session), [ch. 3](docs/book/week3/03-debugger.html) | checkpoints: Buffer A (week 7, addresses), week 11 (threads, a TSan report), week 17 (raw mmap'd memory), week 22 (cuda-gdb or compute-sanitizer) | planned |
| File I/O, binary formats with a header, endianness | Systems | Weeks 3 and 5 (replay and dungeon save, both stretch), otherwise Week 17 / loader | week 17 (safetensors, GGUF in miniature), week 19 | planned |
| Linux container parity (arm64 OrbStack), cachegrind, gdb; no AVX2 and no perf counters in the container | Systems | Week 6 / particles | weeks 12, 13 (arm64 build), 17 (arm64 binary with runtime dispatch), 18 | planned |
| `mmap`, page faults, UTF-8 | Systems | Week 17 / loader | week 28 | planned |

## Memory, performance, benchmarking

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| Timing with `steady_clock`, warm-up, variance, ms per step and ns per cell | Memory and performance | Weeks 1 and 2 / 01-life, [ch. 13](docs/book/week1/13-timing-and-benchmark.html) | week 12 (methodology in full, core class) | in progress |
| Release vs Debug: what `-O2` changes and why sanitizers cost time | Memory and performance | Weeks 1 and 2 / 01-life, [ch. 13](docs/book/week1/13-timing-and-benchmark.html) | week 6 (`-O0` to `-O3 -march=native`) | in progress |
| Writing a `BENCH.md` (machine, date, build, number, a sentence of interpretation) | Memory and performance | Weeks 1 and 2 / 01-life, [ch. 13](docs/book/week1/13-timing-and-benchmark.html) | every week | in progress |
| Cache lines, AoS vs SoA, alignment, prefetching, `reserve` | Memory and performance | Week 6 / particles | weeks 12, 15 | planned |
| Google Benchmark; counters from Instruments (CPU Counters: cache misses, IPC; Time Profiler) on the Mac and cachegrind in the arm64 container | Memory and performance | Week 6 / particles | weeks 11, 12 | planned |
| Blocking and tiling | Memory and performance | Week 15 / tensor (cache-blocked matmul; cache blocking first met in week 6) | week 23 | planned |
| Roofline model, arithmetic intensity, memory-bound vs compute-bound | Memory and performance | Week 12 / SIMD and roofline | weeks 18, 23 | planned |
| Flame graphs (samply), Instruments Time Profiler, amortising allocations | Memory and performance | Week 18 / generation | week 25 | planned |

## Ownership

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| Stack vs heap (as `std::vector` hides it) | Ownership | Weeks 1 and 2 / 01-life, [ch. 6](docs/book/week1/06-vector.html) (mentioned), deep in Buffer A (week 7, lldb on addresses) | week 10 | in progress |
| Pointers, `unique_ptr`, `shared_ptr`, when to use neither | Ownership | Buffer A (week 7, lldb on addresses: print, watch a vector reallocate, step into a destructor) and Week 10 / paged store (`unique_ptr`, `shared_ptr`, when neither) | weeks 15, 18, 22 (device memory) | planned |
| Copy vs move, rule of five, custom deleters | Ownership | Week 10 / paged store | weeks 15, 25 | planned |
| Allocators, `std::pmr` (first to drop), arenas and pools, placement `new` | Ownership | Week 10 / paged store | week 18 (KV cache pages), week 25 (memory planning against a fixed local memory) | planned |

## Numbers

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| IEEE 754, fp16 / bf16, fixed point | Numbers | Week 9 / numbers | weeks 16, 17 (bf16 to fp32 in the loader), 24 | planned |
| Integer overflow and UB, `bit_cast` | Numbers | Week 9 / numbers | week 12 | planned |
| Block quantisation (Q8_0, Q4_0), error measurement | Numbers | Week 9 / numbers | weeks 19, 24, 27 | planned |
| Affine int8 quantisation: scale and zero point, per-channel vs per-tensor, int8 x int8 accumulated in int32, requantisation with a fixed-point multiplier and shift, min-max vs percentile calibration | Numbers | Week 9 / numbers | week 20 | planned |
| Static int8 (W8A8) with calibration over a graph: min-max calibration set, per-layer scales, saturating requantisation, the calibration report | Numbers | Week 20 / int8 calibration | week 25 (`npu-sim` runs only int8 matmul), week 28 (ONNX Runtime's int8 path) | planned |
| Numerical stability (max-subtraction, epsilon), perplexity | Numbers | Week 16 / ops (stability), Weeks 18 and 19 (perplexity) | weeks 20, 24 | planned |

## Generic programming

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| Templates and concepts (a generic `Grid<T>`) | Generic programming | Week 8 / boids | week 15 | planned |
| `if constexpr`, template specialisation, compile-time dispatch, `constexpr` functions and tables, function-pointer tables | Generic programming | Weeks 9 / numbers (`constexpr`), 16 / ops (function-pointer tables), 19 / quantised inference (specialisation per quant type) | weeks 23 (template kernels for tile sizes), 25 (function-table dispatch) | planned |

## Parallelism and SIMD

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| Threads, mutexes, condition variables, atomics, memory ordering | Parallelism | Week 11 / job system | weeks 13, 15, 18 | planned |
| False sharing, barriers, job systems, work stealing, ThreadSanitizer | Parallelism | Week 11 / job system | week 13 | planned |
| NEON intrinsics (dotprod, i8mm), AVX2 as stretch, horizontal reductions, auto-vectorisation, reading assembly | SIMD | Week 12 / SIMD and roofline | weeks 15, 19 | planned |

## CUDA

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| Host / device memory, launches, grids / blocks / warps, 2D indexing, shared memory, `cudaEvent` timing, Nsight Systems | CUDA | Week 22 / Life on GPU | weeks 23 to 25 | planned |
| Reductions (sum, max, argmax), warp shuffles (`__shfl_down_sync`), occupancy | CUDA | Week 22 / Life on GPU | weeks 23, 24 | planned |
| Tiling, coalescing, register pressure, Nsight Compute (where the host allows) | CUDA | Week 23 / matmul | weeks 24, 25 | planned |
| Row-wise softmax and RMSNorm on GPU, online softmax, kernel fusion, dequant-on-the-fly matvec, `half2` maths | CUDA | Week 24 / attention | week 25 | planned |
| Streams, overlapping copy and compute, pinned memory and async copies, memory planning against a fixed local memory | CUDA | Week 25 / backends | weeks 27, 28 | planned |

## Reading large codebases

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| Mapping ggml structs, kernels, thread pool, ggml-backend and ggml-alloc to your own code | Reading | Week 27 / read ggml | week 29 | planned |
| llama.cpp decode, KV cache, sampling chain, GGUF loading, server batching; vLLM scheduler and block manager; ONNX Runtime's int8 GEMM | Reading | Week 28 / read llama.cpp | week 29 | planned |
| Contribution workflow: issue, PR, benchmark evidence | Reading | Week 29 / contribute | week 30 (the repo as a story) | planned |

## Maths

Saturday strand, 1.5 hours a week (goal.md section 10). Each row is one Saturday's topic; "Introduced" names
the strand week, not a challenge.

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| Hz, ms per frame, why 60 fps is 16.7 ms | Maths | Week 2 (strand) | week 3 (frame budget), week 18 (tokens/s) | planned |
| Expected count of 10,000 random draws vs the observed count | Maths | Week 3 (strand), [ch. 9](docs/book/week3/09-build-snake.html#saturday-the-strands), `snake_bench draws` | week 5 (loot draws vs the table), week 18 (sampling) | planned |
| 2x2 matrices as transformations, composition as product; the Tetris rotations on paper | Maths | Week 4 (strand) | week 16 (RoPE as rotation on dimension pairs) | planned |
| Distributions, inverse-CDF sampling, expected value; temperature, top-k and top-p as truncation plus renormalisation | Maths | Week 5 (strand) | week 18 | planned |
| Velocity, Euler integration, dot product as projection; one particle for three steps by hand | Maths | Week 6 (strand) | weeks 9, 12 (dot kernels), 15 (matmul) | planned |
| Cosine similarity, N² pairs, big-O as counting; pair counts vs times | Maths | Week 8 (strand) | week 16 (attention as all pairs), week 24 | planned |
| IEEE 754 fields, ulp, relative error, cancellation, quantisation noise (step² over 12); a block's Q8 error by hand | Maths | Week 9 (strand) | weeks 19, 20 | planned |
| Calibration choices: min-max vs percentile, per-tensor vs per-channel, symmetric vs asymmetric; page and offset as division and remainder | Maths | Week 10 (strand) | week 20 | planned |
| Amdahl's law; predicted vs measured speed-up at 2, 4, 8, 10 threads | Maths | Week 11 (strand) | weeks 13, 15, 18 (thread columns) | planned |
| Float addition is not associative; arithmetic intensity, log-log axes, a roofline as two lines; every kernel's intensity by hand | Maths | Week 12 (strand) | weeks 15, 18, 22 to 24 | planned |
| Matmul as rows dotted with columns; strides; 2mnk flops | Maths | Week 14 (Buffer B strand) | weeks 15, 23 | planned |
| A 3x2 by 2x4 multiply with every strided index; a transposed view as swapped strides; broadcasting | Maths | Week 15 (strand) | weeks 16, 17 | planned |
| Softmax as scores to a distribution; max-subtraction; RMSNorm as a length without the mean; attention as an expected value; RoPE as the week 4 rotation; one head on a 3-token toy by hand | Maths | Week 16 (strand) | weeks 18, 24 | planned |
| bf16 vs fp32 bits; the weight file as offsets and strides | Maths | Week 17 (strand) | week 19 | planned |
| Log-probabilities, cross-entropy, perplexity as exp of mean negative log-likelihood; 5 tokens by hand | Maths | Week 18 (strand) | weeks 19, 20, 28 | planned |
| Error propagation to perplexity; mean vs max error; why per-channel scales tame outliers | Maths | Week 19 (strand) | week 20 | planned |
| Activation outliers and why per-tensor W8A8 loses perplexity; the u8s8 vs s8s8 zero-point shift | Maths | Week 20 (strand) | week 28 (ONNX Runtime's int8 path) | planned |
| Occupancy as threads per core; shared-memory bytes per tile vs reuse; the algebra of online softmax | Maths | Weeks 22 to 24 (strand) | week 25 | planned |

## Model

Saturday reading strand (model literacy, ML 1 to 4) in Phase 2, Karpathy's lecture in Phase 3, consolidated
in Buffer B. Each row names the note in `docs/model/` that teaches it.

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| A layer is a matmul plus a non-linearity; SmolLM2 and GPT-2 bytes at fp32, int8 and 4-bit by hand (ML 1) | Model | Week 6 (strand) | weeks 9, 15 | planned |
| Attention on paper: one head, 3 tokens, dimension 4 (ML 2) | Model | Week 7 (Buffer A strand) | week 16 | planned |
| Tokens, embeddings, logits, the residual stream, in your own words (ML 3) | Model | Week 8 (strand) | weeks 16 to 18 | planned |
| What a KV cache stores; its bytes at 1,024 tokens for SmolLM2 (3 KV heads) and GPT-2; what GQA buys (ML 4) | Model | Week 9 (strand) | weeks 18, 24 | planned |
| Integer quantisation (Wu et al., 2020); ggml's `block_q8_0` and `block_q4_0` beside your structs | Model | Week 10 (strand) | weeks 19, 20, 27 | planned |
| What a transformer block computes (Karpathy's "Let's build GPT"; one block drawn) | Model | Weeks 13 and 14 (strand, Buffer B) | weeks 16, 17 | planned |
| The shapes of one SmolLM2-135M block by hand (`docs/model/shapes.md`; hidden 576, 9 query heads, 3 KV heads, intermediate 1536, vocabulary 49,152) | Model | Week 14 (Buffer B) | weeks 15 to 18 | planned |
| The NumPy reference forward pass of one block, matched to `tools/dump_reference.py` within 1e-4 | Model | Week 14 (Buffer B) | week 16 (the conformance oracle), week 17 | planned |

## Interview

Wednesday Read block from Wed 10 Feb 2027 (week 14), 90 minutes. Status tracks whether you can answer cold.

| Concept | Area | Introduced | Reused | Status |
|---|---|---|---|---|
| The two-minute repo story | Interview | Week 14 (Buffer B, Wed 10 Feb) | week 21 (Buffer C: CV, portfolio summary), week 30 (timed) | planned |
| Virtual dispatch: virtual vs `switch` vs template, predicted then measured | Interview | Week 15 (strand) | week 25 (function-table dispatch instead), mock interviews to week 30 | planned |
| Exceptions: unwinding, `noexcept`, why inference code avoids them, `std::expected` | Interview | Week 16 (strand) | week 17 (`std::expected` in the loader), mock interviews to week 30 | planned |
| Templates beyond containers, enough to read ggml-cpu dispatch | Interview | Week 17 (strand) | weeks 19, 27 | planned |
| Classic questions 1: rule of zero and five, copy elision, `std::move`, ODR, UB, virtual destructors, slicing, dangling references | Interview | Week 18 (strand) | mock interviews weeks 20 to 30 | planned |
| Classic questions 2: iterator invalidation, SSO, alignment, placement `new`, strict aliasing, `volatile` vs atomic, the memory model, data races | Interview | Week 19 (strand) | mock interviews weeks 20 to 30 | planned |
| Edge-accelerator design questions: a KV cache under a memory budget; quantise for an int8 accelerator; a missing operator and fallback; why operator coverage dominates an edge SDK roadmap; ONNX vs GGUF | Interview | Week 20 (strand) | weeks 25, 28, mock interviews to week 30 | planned |
| Speculative decoding (read, not built; Leviathan et al., 2023) | Interview | Week 24 (strand) | mock interviews to week 30 | planned |
| Mock interviews (45 min plus one timed whiteboard problem) | Interview | Week 20 (first, Wed 24 Mar 2027) | weekly to week 30 | planned |
