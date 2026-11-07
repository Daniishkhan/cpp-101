# 02-snake: Snake in the terminal

**Week 3** (Mon 23 Nov to Sat 28 Nov 2026; Sunday 29 Nov off) · Phase 1, terminal games ·
Book: [docs/book/week3](../../docs/book/week3/index.html), challenge chapter:
[9 Build Snake](../../docs/book/week3/09-build-snake.html)

> **DRAFT, not frozen.** Claude wrote this spec, the header contract, the stubs and the tests on
> 7 Nov 2026 so that the week's material exists in time. It becomes the real spec in your
> 20-minute spec ritual ([docs/methodology.md](../../docs/methodology.md)) on **Fri 20 Nov 2026**:
> you go through [Decisions for the spec ritual](#decisions-for-the-spec-ritual) below, change
> what you disagree with, and then the spec is frozen. Claude regenerates any test whose rule you
> changed before Mon 23 Nov. After that, scope only shrinks in writing (methodology, "When a week
> slips").

## Concept

A snake moves around a walled board, one cell per **tick**. You steer it with the arrow keys or
WASD; it never stops. Each piece of food it eats makes it one cell longer, scores a point and, every
5 points, makes the ticks shorter. It dies when its head hits the wall or its own body. The board is
redrawn in place every tick, like Life, but now the program also **listens to the keyboard while it
runs**, which means switching the terminal into raw mode and, whatever happens, switching it back.

C++ you learn this week: `struct` (your own types: `Point`, `Game`), `enum class` and `switch`
(`Direction`, `Key`, `State`), `std::deque` (a body that grows at the head and shrinks at the tail),
`std::optional` ("no key was pressed", "no free cell"), scope and lifetime, RAII (a guard that
restores the terminal in its destructor), by-value vs by-reference with real types, and the
debugger (lldb), taught in a 75-minute session on Tue 24 Nov.

Concepts this week **introduces** (rows of [CONCEPTS.md](../../CONCEPTS.md)): `struct`, `enum class`,
`switch`; scope and lifetime, RAII (a guard that restores the terminal); `std::optional` for "no
value"; `std::deque`; raw terminal mode and keyboard input; the debugger (lldb); signals and a flag
(Ctrl-C without losing the clean-up); and the Maths row "expected count of 10,000 random draws vs
the observed count". It **reuses**: references and pass by value vs by reference (week 1, deepened
here), value semantics, `std::vector`, `std::string`, `argc`/`argv`, `std::mt19937` (now passed by
reference), `std::chrono` (the frame budget), stdout and ANSI redraw, CMake, sanitizers, doctest, and
the game loop as a decode loop (deepened here).

**Where the numbers come from:** this Mac (Apple M5, macOS 26, Apple clang 21), Release build, on
mains power. (The spec ritual confirms this line.)

## Inference twin

- **The game loop is a decode loop.** One tick is one step of the model: read the input, update the
  state, emit one frame (one token), then wait for the next deadline. The tick has a fixed time
  budget (`tick_ms`, 150 ms down to 60 ms); a tick whose work overruns its budget is a **dropped
  frame**, which in a chat window is a **latency spike**. The program counts them.
- **Each tick costs more as the snake grows.** To know whether the new head bit the body, the game
  checks it against every cell of the body, so the work per tick grows with the length. A decode
  step does the same with its context: attention looks at every earlier token's key and value, so
  each new token costs more as the KV cache grows. The benchmark measures exactly that line.
- **A snake that does not eat is a sliding window.** Every tick it adds one cell at the front and
  drops one at the back, so it remembers only its last N positions. Sliding-window attention keeps
  only the last N tokens of the KV cache the same way, and `std::deque` is the shape of that buffer.

## Spec

The program is `snake`, run from the terminal.

| Argument | Meaning | Default |
|---|---|---|
| `--width N` | columns of the board, the wall not counted; 8 to 200 | 30 |
| `--height N` | rows of the board, the wall not counted; 5 to 100 | 15 |
| `--seed N` | seed for the food; `0` means "take one from the clock". The seed in use is printed at the end, so a game can be replayed | 0 |

A width, height or seed that is not a number, or a size outside its range, prints one line saying
what is wrong and exits with status 2, before the terminal is touched.

Behaviour:

- **Start.** A snake of 3 cells, head at `(width / 2, height / 2)` and the two other cells to its
  left, moving right; one piece of food on a random free cell; score 0. Column `x` runs left to
  right from 0 and row `y` runs top to bottom from 0, so moving up makes `y` smaller.
- **Ticks.** A tick lasts `tick_ms(score)` milliseconds: 150 ms at score 0, 10 ms less for every 5
  points, never less than 60 ms. Each tick the head moves one cell in its heading.
- **Keys.** Arrow keys or `w` `a` `s` `d` (either case) steer; `p` pauses and resumes; `q` quits.
  At most one key counts per tick: the first one read in that tick. A key that would reverse the
  snake (left while moving right) is ignored.
- **Eating.** When the head lands on the food: score +1, the snake is one cell longer (its tail
  stays put that tick), and new food appears on a random free cell, every free cell equally likely.
  If no free cell is left, the game is **won**.
- **Dying.** The game is **lost** when the head would move into the wall or onto the body. The
  cell the tail is leaving in the same tick does not count as body. On the losing tick the snake
  does not move, so the last frame shows it just before the crash.
- **Drawing.** Every tick the program moves the cursor home and redraws the whole frame in one
  write (no scrolling, no flicker, chapter 9 of the Week 1 book): the board from `render` (`#` wall,
  `@` head, `o` body, `*` food, space for empty), then one status line, for example
  `score 7   length 10   120 ms per tick` (or `paused` while paused).
- **The keyboard.** While the game runs the terminal is in raw mode: keys arrive without Enter and
  are not echoed, and the cursor is hidden.
- **The way out.** However the game ends (lost, won, `q`, or **Ctrl-C**), the terminal is put back
  exactly as it was (echo, line mode, cursor) before the program prints its last line and exits
  with status 0, for example:
  `game over: score 7, length 10, 812 ticks, 0 late, seed 1764078512`
  where **late** counts the ticks whose work (reading keys, `tick`, building and printing the frame)
  took longer than that tick's budget.

Example: `./build/snake --width 40 --height 20 --seed 7`

## The contract

[`src/snake.hpp`](src/snake.hpp) declares the game: three `enum class` types, two `struct`s, a
`Body` alias and nine functions. [`src/terminal.hpp`](src/terminal.hpp) declares the keyboard side:
the `RawTerminal` guard and `read_keys`. You write their definitions in [`src/snake.cpp`](src/snake.cpp)
and [`src/terminal.cpp`](src/terminal.cpp), and the program in [`src/main.cpp`](src/main.cpp). The
tests call these exact names and signatures, so keep them.

| Type | One line |
|---|---|
| `enum class Direction { Up, Down, Left, Right }` | where the head goes next |
| `enum class Key { Up, Down, Left, Right, Pause, Quit }` | what a key press means |
| `enum class State { Playing, Lost, Won }` | where the game stands |
| `struct Point { int x; int y; }` | one cell; compares with `==` |
| `using Body = std::deque<Point>` | the snake, head first |
| `struct Game` | width, height, body, heading, food, score, state |
| `struct RawTerminal` | the guard: raw mode while it lives, the old settings back when it dies |

| Function | One line |
|---|---|
| `Point next_head(Point head, Direction heading)` | the cell one step away; may be outside the board |
| `int tick_ms(int score)` | the tick budget: 150 ms, 10 ms less per 5 points, at least 60 |
| `std::string render(const Game& game)` | the board as text: walls, `@`, `o`, `*`, spaces |
| `bool on_body(const Body& body, Point p)` | is this cell part of the snake? |
| `Direction steer(Direction heading, std::optional<Direction> wanted)` | the next heading; no key keeps it, a reversal is ignored |
| `std::optional<Key> parse_key(const std::string& bytes)` | the first key in what was read, or nothing |
| `std::optional<Point> place_food(const Body&, int width, int height, std::mt19937& rng)` | a fair random free cell, or nothing when the board is full |
| `Game new_game(int width, int height, std::mt19937& rng)` | three cells in the middle, heading right, food placed |
| `void tick(Game& game, std::optional<Direction> wanted, std::mt19937& rng)` | one tick: steer, move, eat, grow, die or win |
| `RawTerminal()` / `~RawTerminal()` | enter raw mode and hide the cursor / restore both |
| `std::string read_keys()` | every byte waiting on the keyboard now, `""` if none |

### Milestones

Do them in order; each turns specific tests green. Commit after each one. The Read block of each day
covers the book chapters that milestone needs (book [chapter 0](../../docs/book/week3/00-start-here.html)
has the full day-by-day plan).

| | Day | Milestone | Turns green |
|---|---|---|---|
| **M1** | Mon 23 Nov | `next_head` and `tick_ms` | the two `next_head: ...` cases, `tick_ms: ...` |
| **M2** | Tue 24 Nov | `render` | the two `render: ...` cases |
| **M3** | Wed 25 Nov | `on_body`, `steer` and `parse_key` | `on_body: ...`, the two `steer: ...` and four `parse_key: ...` cases |
| **M4** | Thu 26 Nov | `place_food`, `new_game` and `tick` | the four `place_food: ...`, two `new_game: ...` and eight `tick: ...` cases; all 26 pass |
| **M5** | Fri 27 Nov | `RawTerminal` and `read_keys` | manual: the scratch key check from book chapter 9, run as `keys; cat` |
| **M6** | Fri 27 Nov | `main`: arguments, the loop, the keys, pause, the last line | manual: it plays; every way out restores the terminal |
| **M7** | Sat 28 Nov | Benchmark: Release `snake_bench` and `snake_bench draws`, [BENCH.md](BENCH.md) | BENCH.md has the tick table, the render rows and the Experiment |

Three test cases pass before you write anything (a stub that does nothing is right by accident about
reversals, unknown keys and a finished game). Book chapter 9 explains why that matters.

Stuck? The hint ladders are in book chapter 9. Ask Claude for one rung at a time.

## Acceptance tests

- [ ] `./build/snake_tests` reports **26 passed, 0 failed** in a Debug build (sanitizers on, no
      reports).
- [ ] The game plays with the defaults; the snake grows, the score and the speed go up as specified,
      and the wall and the body end the game. (Winning is proven by the test `tick: eating the last
      free cell wins the game`; winning an 8 × 5 board by hand is possible but not required.)
- [ ] After every way out (lost, `q`, Ctrl-C, and won if you manage it) the cursor is visible, the
      last line shows score, length, ticks, late ticks and seed, and `./build/snake; cat` leaves `cat`
      waiting for you and echoing what you type. (zsh switches echo and line mode back on before its
      own prompt, so only a program on the same command line shows what the game left behind.)
- [ ] Bad arguments (`--width 3`, `--seed banana`) print one line and exit with status 2.
- [ ] [BENCH.md](BENCH.md) has the tick-cost table at five lengths in Release, the two render rows,
      a Debug row for comparison, and the Experiment section (prediction written before the run,
      measurement, explanation), with machine and date.
- [ ] The `draws` table and your hand prediction for it are in the week log (the maths strand).
- [ ] One commit per milestone (M1 to M7), formatted by the pre-commit hook.
- [ ] One blocker in the week log names the lldb command that solved it (goal.md, week 3).
- [ ] The Friday review has been run (see [CLAUDE.md](../../CLAUDE.md)) and its three questions are
      answered in the week log (`docs/log/2026-W48.md`).

## Stretch goals (only after the gate is passed)

1. **Replays** (goal.md): `--record FILE` writes the seed and one line per tick with the key that
   counted (or `-`); `--replay FILE` plays the same game back without the keyboard. Your first file
   I/O: `std::ofstream` and `std::ifstream`.
2. **A constant-time collision check**: keep a `width × height` grid of "is there body here?"
   next to the deque, updated when the head is added and the tail removed, so `tick` no longer
   walks the body. Predict the new tick-cost line before you measure it with `snake_bench`.
3. **Wrap-around walls** with `--wrap`: the board becomes a torus, like Life; your Life `wrap` comes
   back.

## Decisions for the spec ritual

Fri 20 Nov 2026, 20 minutes, in this order. Each line is Claude's draft choice and what the
alternative would change. Strike through or edit, then write "frozen 20 Nov 2026" at the top.

1. **Walls kill** (draft) or the board wraps like Life's torus (then `tick` loses the wall check and
   gains `wrap`, and stretch 3 disappears).
2. **Empty cells are spaces** (draft) or `.` as in Life (easier to count in a failing test,
   busier on screen). Changes the three `render` cases.
3. **The speed curve**: 150 ms, 10 ms faster every 5 points, floor 60 ms (draft). Any three numbers
   will do; they go into `tick_ms`'s comment and test.
4. **Ctrl-C** (draft): Ctrl-C keeps sending its signal; `main` asks for the signal to set a flag,
   the loop sees the flag and ends normally, and the guard restores the terminal. This is what the
   Week 1 book promised in chapter 9. The alternative turns the signal off in raw mode, so Ctrl-C
   arrives as the byte 3 and `parse_key` turns it into `Key::Quit`, with no signal code at all; the
   price is that a game stuck in a loop can then only be stopped from another terminal. (`parse_key`
   maps the byte 3 to `Quit` in both cases.)
5. **Keys**: arrows and WASD in either case, `p`, `q` (draft). Space for pause as well? Only the
   **first** key read in a tick counts (draft) or the last one (more responsive when you press two
   keys inside one tick), or a small queue. Changes `parse_key`'s fifth test case.
6. **The default seed**: `0` = from the clock, printed at the end (draft), or a fixed `1` like Life
   (every default game the same).
7. **Sizes**: default 30 × 15, allowed 8 × 5 to 200 × 100 (draft). Does an 80-column terminal fit
   your default, wall included?
8. **Score**: +1 per piece of food (draft) or more for a longer snake.
9. **The tail rule**: moving into the cell the tail leaves is allowed (draft, the classic rule) or
   counts as a bite (then one `tick` case flips).
10. **Late ticks** reported at exit (draft) or moved to stretch. With 60 to 150 ms budgets they
    should be 0; the point is that you measured it.
11. **Pause** in the must list (draft) or moved to stretch.
12. **Stretch goals**: replays (from goal.md) and the constant-time collision grid (draft), or swap
    one for wrap-around walls.
13. **Which machine** the numbers come from (one line, above).

## Build and run

```sh
cd phase1-terminal/02-snake

# Debug build (default): warnings on, AddressSanitizer + UBSan on
cmake -S . -B build -G Ninja
cmake --build build
./build/snake_tests
./build/snake --width 30 --height 15

# Release build for the benchmark
cmake -S . -B build-release -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build-release
./build-release/snake_bench          # tick cost vs length, render cost
./build-release/snake_bench draws    # 10,000 food draws for the maths strand
```

If a run leaves your terminal strange, `tput cnorm` brings back a hidden cursor and `reset` puts
everything back (type it blind if nothing echoes). zsh, the default shell on macOS, switches echo and
line mode back on by itself before its next prompt; bash does not. Book chapter 7 explains why.

## Files

```
README.md               this file: the spec (draft until Fri 20 Nov 2026, then frozen)
CMakeLists.txt          build recipe (given)
BENCH.md                your numbers (you fill in)
src/snake.hpp           the game's contract (given, do not change signatures)
src/snake.cpp           YOUR game functions (stubs given)
src/terminal.hpp        the keyboard contract: RawTerminal and read_keys (given)
src/terminal.cpp        YOUR guard and key reader (stubs given)
src/main.cpp            YOUR program (stub given)
tests/snake_test.cpp    26 doctest cases (given)
bench/bench_snake.cpp   the timing and food-draw harness (given)
```
