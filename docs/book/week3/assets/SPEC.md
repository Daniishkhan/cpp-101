# Week 3 book — author spec (read all of it before writing a chapter)

The Week 3 book is **"C++ from Life to Snake"**, in `docs/book/week3/`. It follows the Week 1 book's
author spec (`docs/book/week1/assets/SPEC.md`) in everything this file does not change: voice,
pedagogy, the HTML contract, the code-block checks, callouts, quizzes. Read that file first, then
this one. Where the two disagree, this one wins for Week 3.

## Who reads this

Danish, two weeks into C++. He started from zero on Mon 9 Nov 2026 and has just finished Conway's
Game of Life (weeks 1 and 2, `phase1-terminal/01-life`) by hand: functions, references and `const`,
`std::vector`, `std::string`, flat 2D indexing, `argc`/`argv`, `std::mt19937`, ANSI redraw,
`std::chrono` frame pacing, headers, CMake, doctest, sanitizers. Everything the Week 1 book taught is
known; nothing else is. He wants first principles, analogies that say where they break, and no
assumed knowledge. Mac (Apple M5, macOS 26, Apple clang 21), C++23, `tools/run.sh FILE.cpp`.

## The week

Snake in the terminal: `phase1-terminal/02-snake/README.md` (the spec, a draft until the spec ritual
on Fri 20 Nov 2026), `src/snake.hpp` and `src/terminal.hpp` (the contract), `tests/snake_test.cpp`
(26 doctest cases), `bench/bench_snake.cpp`. Mon 23 to Sat 28 Nov 2026; Sunday off.

| Day | Read block (60 to 90 min) | Code block | Milestone |
|---|---|---|---|
| Mon 23 Nov | 00 Start here, 01 Structs, 02 enum class and switch | `next_head`, `tick_ms` | M1 |
| Tue 24 Nov | 03 The debugger (the 75-minute lldb session) | `render` | M2 |
| Wed 25 Nov | 04 std::deque, 05 std::optional | `on_body`, `steer`, `parse_key` | M3 |
| Thu 26 Nov | 06 By value or by reference, 07 Scope, lifetime and RAII | `place_food`, `new_game`, `tick` | M4 |
| Fri 27 Nov | 08 Raw keys and the game loop | `RawTerminal`, `read_keys`, `main` | M5, M6 |
| Sat 28 Nov | strands: maths (10,000 draws), measurement (M7 bench, the `switch` in Compiler Explorer), write-up | | M7 |

Chapters are 2,000 to 4,000 words of prose plus code (the reader is no longer at zero, and a Read
block is fixed), except chapter 3, which is a guided 75-minute session.

## The one rule from CLAUDE.md

The learner hand-codes Snake. The book may TEACH every mechanism with complete worked examples, but
it must NEVER contain a working implementation, a sketch, pseudo-code or a "fixed" version of:

- the Snake contract: `next_head`, `tick_ms`, `render`, `on_body`, `steer`, `parse_key`,
  `place_food`, `new_game`, `tick` (`src/snake.hpp`), the `RawTerminal` constructor and destructor
  and `read_keys` (`src/terminal.hpp`), nor a Snake `main`;
- the Life contract of weeks 1 and 2 (`index_of`, `wrap`, `count_neighbours`, `step`,
  `random_cells`, `render`) or a Life `main`.

Teach each mechanism on a DIFFERENT problem that is one step away, with its own names:

| Mechanism | Teach it with | Never |
|---|---|---|
| struct | a calendar date, an RGB colour, a playing card, a recipe line, a reading from a weather station | a function that moves a 2D point one cell in a direction |
| enum class and switch | a traffic light, a card suit, a weekday, a vending machine, a washing-machine programme | a `Direction` enum, a "move one step" switch, a "reverse of" or "opposite" check |
| std::deque | a queue at a counter, a moving average of the last N readings, an undo history with a limit, a train of carriages | a list of points that grows at the front and drops its back on a board; a function named or shaped like `on_body` over `Point`s |
| std::optional | a sensor that may have no reading, the first even number in a list, a number parsed from text, a word looked up in a small table | bytes of a key turned into a key enum (`parse_key`); "a random free cell, or none" |
| by value or by reference | dice rolled by an engine passed by value (the repeat trap) and by reference, a bank balance updated through `&`, a big deque copied vs `const&` | choosing a random free cell on a board |
| scope, lifetime, RAII | a struct that prints in its constructor and destructor, a guard that hides the cursor, a guard that turns echo off for a password prompt, Ctrl-C ending a countdown cleanly through a flag | one guard that turns echo AND line mode off AND makes reads return at once AND hides the cursor (that is `RawTerminal`) |
| raw keys, the loop | a key logger that blocks for one key at a time and prints its bytes; a metronome that checks for a key with `poll()`; deadlines with `sleep_until`; counting late beats | a non-blocking reader that collects every waiting byte into a string (`read_keys`); a loop that reads keys, ticks a game and renders a board |

The word lists that must not name any function or type in an example: `next_head`, `tick_ms`,
`render`, `on_body`, `steer`, `parse_key`, `place_food`, `new_game`, `tick`, `read_keys`,
`RawTerminal`, and the Life names. Do not define types called `Direction`, `Key`, `State`, `Game`
or `Body` in examples; `Point` may appear as a plain struct of two ints, never with a move function.
The tutor's guard (`tools/tutor.py`, `looks_like_solution`) is run over every C++ block of this book
by `python3 tools/test_tutor.py`; a block it flags is a block that came too close.

Chapter 9 (Build Snake) gives hint ladders that get CLOSE (the rule in words, which switch or loop
goes where, what to test first) but stops short of the code, as Week 1's chapter 14 did.

## Allowed by chapter (do not use a construct before its chapter)

Everything in the Week 1 list is allowed from chapter 0. New this week:

| Ch | File | New constructs |
|---|---|---|
| 00 | `00-start-here.html` | nothing (orientation; shell commands only) |
| 01 | `01-structs.html` | `struct` with public data members and default member values; brace initialisation `Date d{2026, 11, 23}` and designated initialisers `{.year = 2026}`; `.` member access; structs as parameters and return values; structs in a `std::vector`; `bool operator==(const T&) const = default;` taken on trust ("the compiler writes the comparison; operators are week 4"); `sizeof` a struct |
| 02 | `02-enum-class-and-switch.html` | `enum class`, `Name::Value`, `static_cast<int>` of an enumerator; `switch`, `case`, `break`, `default`, `return` from a case; `-Wswitch`; the fallthrough trap (`[[fallthrough]]` named only) |
| 03 | `03-debugger.html` | no new C++. lldb: `breakpoint set`, `run`, `next`, `step`, `finish`, `frame variable`, `p`, `breakpoint modify -c`, `bt`, `up`/`down`, `continue`, `quit`; printing a `std::vector` and a `std::deque` (a deque is introduced in one paragraph as "a vector that can also grow at the front; chapter 4") |
| 04 | `04-deque.html` | `std::deque`: `push_front`, `push_back`, `pop_front`, `pop_back`, `front`, `back`, `size`, `empty`, `[]`, `clear`, range-for |
| 05 | `05-optional.html` | `std::optional<T>`, `std::nullopt`, `has_value()`, `*opt`, `opt->member`, `value_or`, comparing an optional with a value; returning and passing optionals. `.value()` is named with a warning only (it throws, and this course uses no exceptions) |
| 06 | `06-value-or-reference.html` | no new syntax: deliberate choices between `T`, `const T&` and `T&` for structs, containers and `std::mt19937`; `std::uniform_int_distribution<int>` (the integer sibling of Week 1's real distribution); returning structs by value; a reference into a vector that dies when the vector grows (ASan) |
| 07 | `07-lifetime-and-raii.html` | scopes `{ }` and lifetime; variables at namespace scope (globals); `std::getline(std::cin, line)` from `<iostream>` taken on trust (reads one typed line); a flag word and the bit operators `&`, `|`, `~`, `&=`, `|=` from first principles, just enough for terminal flags (week 9 goes deep); a constructor `Name() { }` and a destructor `~Name() { }` inside a struct (week 4 goes deep); order of destruction; RAII guards; `<termios.h>` (`termios`, `tcgetattr`, `tcsetattr`, `TCSANOW`, `ECHO`, `c_lflag`) and `<unistd.h>` (`STDIN_FILENO`) with `&` on a variable taken on trust ("the function needs to know where your variable lives; Buffer A shows addresses"); `<csignal>`: `std::signal`, `SIGINT`, a handler function, `volatile std::sig_atomic_t`; `reset` and `stty sane` |
| 08 | `08-keys-and-the-loop.html` | `ICANON`, `VMIN`, `VTIME`, `c_cc`; `read(STDIN_FILENO, &c, 1)` and what it returns; escape sequences of the arrow keys; `<poll.h>` (`pollfd`, `poll`, `POLLIN`); `std::chrono::steady_clock::time_point`, `std::this_thread::sleep_until`; deadlines; counting late frames |
| 09 | `09-build-snake.html` | nothing new: the challenge |
| 10 | `10-appendix.html` | nothing new: errors, lldb cheat sheet, glossary |

Never in Week 3: classes with private members or invariants and member functions other than the
constructor, the destructor and the defaulted `==` (week 4), copy and move (week 4), operator
overloading (week 4), `std::array` (week 4), `static` (week 4), pointers beyond the `&` handed to a C
function (Buffer A, week 10), templates of your own, exceptions, lambdas, iterators beyond
range-for, `<algorithm>` (week 5), file I/O (a stretch goal only).

## HTML contract (differences from Week 1)

- `<title>NN · Title — C++ from Life to Snake</title>`; `<p class="chapter-kicker">Chapter NN</p>`.
- The `<head>` loads the shared styles and theme from the Week 1 book and this book's own scripts:

```html
<link rel="stylesheet" href="../week1/assets/book.css?v=9">
<link rel="stylesheet" href="../week1/assets/tutor.css?v=9">
<script src="../week1/assets/theme.js?v=9"></script>
<script defer src="assets/book.js?v=9"></script>
<script defer src="assets/tutor.js?v=9"></script>
```

- `assets/book.js` holds this book's chapter list (the sidebar, prev/next and progress come from it);
  `assets/tutor.js` sends `week3/<page>` to the tutor so it answers with the Week 3 prompt.
- Links to the Week 1 book: `../week1/07-flat-grid.html` (and `#anchor`). Paths in prose stay
  relative to the repo root: `phase1-terminal/02-snake/src/snake.hpp`.
- Programs that need a terminal (raw mode, `tcgetattr`, signals, `poll`/`read` on the keyboard,
  sleeps, ANSI) are `data-check="compile"`: book-check runs `run` blocks with no terminal and no
  input. Everything else is `data-check="run"` with its exact output in a `pre.output`.
- Verify a chapter: `python3 tools/book-check.py docs/book/week3/NN-file.html` (0 problems) and
  `python3 tools/test_tutor.py Week3BookExamplesAreNotSolutions` (the guard scan).
