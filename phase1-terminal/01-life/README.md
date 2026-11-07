# 01-life: Conway's Game of Life in the terminal

**Weeks 1 and 2** (Mon 9 Nov to Sun 22 Nov 2026) · Phase 1, terminal games · Book: [docs/book/week1](../../docs/book/week1/index.html),
challenge chapter: [14 Build the Game of Life](../../docs/book/week1/14-build-life.html)

## Concept

A grid of cells, each alive or dead, stored as **one flat `std::vector`** indexed by `y * width + x`.
Every generation, each cell looks at its eight neighbours and the rules decide whether it lives. The
grid is a **torus**: the left edge touches the right edge and the top touches the bottom, so every cell
has exactly eight neighbours and there are no special cases at the borders. You redraw the whole grid
in place in the terminal a few times a second so it looks like an animation.

C++ you learn this week: the compilation model (headers vs sources), `int` / `size_t` / `bool` /
`uint8_t`, `std::vector`, flat 2D indexing, functions, `const`, references, `std::string`, `argc/argv`,
seeded randomness, `std::chrono` for frame timing, your first CMake build and your first doctest run.

Concepts introduced and reused: see the 01-life rows (weeks 1 and 2) in [CONCEPTS.md](../../CONCEPTS.md).

## Inference twin

- **A tensor is a flat array plus a shape.** Your `Cells` vector with a `width` and a `height` is a
  rank-2 tensor stored row-major. `index_of` is the stride computation every tensor library does.
- **The Life step is a 3x3 stencil.** Each output cell is a function of a small neighbourhood of input
  cells. That is the exact shape of every elementwise and convolution kernel you will write, including
  the CUDA port of this very program in week 22.
- **Double buffering is ping-pong buffers.** You read from `current` and write to `next`, then swap.
  Inference engines do the same with activations and KV-cache slots so that no read sees a half-written
  result.

## Spec

The program is `life`, run from the terminal.

| Argument | Meaning | Default |
|---|---|---|
| `--width N` | columns | 60 |
| `--height N` | rows | 20 |
| `--seed N` | seed for the random starting grid; the same seed always gives the same grid | 1 |
| `--fill F` | probability in [0, 1] that a cell starts alive | 0.3 |
| `--fps N` | generations per second | 10 |
| `--steps N` | how many generations to run; `0` means run forever (until Ctrl-C) | 0 |

Behaviour:

- The grid is **toroidal** (wraps on both axes).
- A live cell is drawn as `#`, a dead cell as `.`, one row per line, a newline after every row.
- Each frame, the program moves the cursor home and redraws the grid in place using ANSI escape codes
  (no scrolling), then sleeps so that `--fps` frames fit in a second.
- The cursor is hidden while animating and **shown again before exit**, including when `--steps` runs
  out.
- Rules (B3/S23): a live cell with 2 or 3 live neighbours survives; a dead cell with exactly 3 live
  neighbours is born; every other cell is dead next generation.

Example: `./build/life --width 80 --height 24 --seed 7 --fps 15`

## The contract

[`src/life.hpp`](src/life.hpp) declares six functions. You write their definitions in
[`src/life.cpp`](src/life.cpp) and the game loop in [`src/main.cpp`](src/main.cpp). The tests call these
exact names and signatures, so keep them.

| Function | One line |
|---|---|
| `int index_of(int x, int y, int width)` | position of cell (x, y) in the flat vector |
| `int wrap(int v, int n)` | bring `v` into `[0, n)` like the hands of a clock, negative numbers included |
| `int count_neighbours(const Cells&, int width, int height, int x, int y)` | how many of the 8 toroidal neighbours are alive |
| `void step(const Cells& current, Cells& next, int width, int height)` | one generation; `current` is never modified |
| `Cells random_cells(int width, int height, unsigned seed, double fill)` | a reproducible random grid |
| `std::string render(const Cells&, int width, int height)` | the grid as text with `#`, `.` and `\n` |

### Milestones

Do them in order; each one turns specific tests green. Commit after each. **Week 1 (Mon 9 to Sat 14 Nov)**
covers book chapters 0 to 10 and M1 to M4; **week 2 (Mon 16 to Sat 21 Nov)** covers chapters 11 to 14 and
M5 to M7. Sunday is off. If M7 is done by Wed 18 Nov, the rest of week 2 is the stretch list and the Snake
spec ritual.

| | Milestone | Turns green |
|---|---|---|
| **M1** | `index_of` | `index_of: row-major flat index` |
| **M2** | `random_cells` and `render` | `random_cells: size, determinism and fill extremes`, `render: ...` |
| **M3** | `wrap` and `count_neighbours` | `wrap: like a clock face`, the three `count_neighbours: ...` cases |
| **M4** | `step` | the six `step: ...` cases; all 13 pass |
| **M5** | `main`: parse the arguments, make a grid, print **one** generation statically | manual: `./build/life --width 10 --height 5 --seed 3` prints a 10x5 grid |
| **M6** | `main`: the animated ANSI loop with `--fps` and `--steps`, cursor restored on exit | manual: it plays, Ctrl-C leaves the terminal usable |
| **M7** | Benchmark: build Release, run `life_bench`, fill in [BENCH.md](BENCH.md) | BENCH.md has Debug and Release rows at 1000x1000 |

Stuck? The hint ladders are in book chapter 14. Ask Claude for one rung at a time.

## Acceptance tests

- [ ] `./build/life_tests` reports **13 passed, 0 failed** in a Debug build (sanitizers on, no reports).
- [ ] The game is playable: `./build/life` animates with the defaults; `--steps 50` stops after 50
      generations with a visible cursor; Ctrl-C does not leave the terminal in a broken state.
- [ ] [BENCH.md](BENCH.md) has at least a Debug and a Release row for 1000x1000, with the machine and
      the date, plus one experiment and a sentence on what you expected.
- [ ] One commit per milestone (M1 to M7), formatted by the pre-commit hook.
- [ ] A review has been run (see [CLAUDE.md](../../CLAUDE.md)) and its three questions are answered
      in the week logs ([W46](../../docs/log/2026-W46.md), [W47](../../docs/log/2026-W47.md)).
- [ ] [BENCH.md](BENCH.md) has an Experiment section: a prediction written before the run, the measurement,
      and two sentences of explanation (the measurement strand, goal.md section 10).

## Stretch goals (only after the gate is passed)

1. **1000x1000 timed** from the game itself: `--width 1000 --height 1000 --steps 20 --fps 0` with
   `--fps 0` meaning "no sleep", printing ms per step at the end. Compare with `life_bench`.
2. **`--pattern glider` and `--pattern rpentomino`**: start from a known pattern placed in the middle
   instead of a random fill.
3. **Colours**: ANSI colour for cells that were just born vs cells that have survived several
   generations (needs an age per cell: what changes in `Cells`?).

## Build and run

```sh
cd phase1-terminal/01-life

# Debug build (default): warnings on, AddressSanitizer + UBSan on
cmake -S . -B build -G Ninja
cmake --build build
./build/life_tests
./build/life --width 60 --height 20 --seed 1 --fps 10

# Release build for the benchmark
cmake -S . -B build-release -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build-release
./build-release/life_bench          # 1000x1000 by default
./build-release/life_bench 2000     # a different size
```

Book chapter 11 explains every line of [CMakeLists.txt](CMakeLists.txt); chapter 12 explains every
test in [tests/life_test.cpp](tests/life_test.cpp); chapter 13 explains the benchmark in
[bench/bench_life.cpp](bench/bench_life.cpp).

## Files

```
README.md            this file: the spec, frozen before the week starts
CMakeLists.txt       build recipe (given)
BENCH.md             your numbers (you fill in)
src/life.hpp         the contract (given, do not change signatures)
src/life.cpp         YOUR implementation (stubs given)
src/main.cpp         YOUR game loop (stub given)
tests/life_test.cpp  13 doctest cases (given)
bench/bench_life.cpp the timing harness (given)
```
