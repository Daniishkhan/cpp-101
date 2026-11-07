# common/: tiny shared headers you grow yourself

Nothing lives here yet, on purpose.

**The rule:** a header moves into `common/` only after **two challenges** have each needed their own
copy of it. Until then, the code stays inside the challenge that uses it. Shared code written before it
is shared is a guess about the future, and the guess is usually wrong.

When the second copy appears, you (not Claude) lift the common part out, keep the signatures that both
challenges actually used, and both challenges `#include` it. Claude may then review it and tidy, but
not add behaviour (see [CLAUDE.md](../CLAUDE.md), "Exceptions").

## Planned

| Header | Expected from | What it will hold | Why it waits |
|---|---|---|---|
| `terminal.hpp` | week 3 (Snake) | clear screen, cursor home, hide/show cursor, a raw-mode guard that restores the terminal in its destructor | Life writes the escape codes inline in `main.cpp`; week 3 (Snake) needs them again plus raw mode. That is the second copy |
| `timer.hpp` | weeks 3 to 4 | a `steady_clock` stopwatch and a frame-rate limiter | Life's benchmark times by hand (on purpose, chapter 13); Snake's game loop (week 3) needs a frame budget |
| `grid.hpp` | week 4 (Tetris) | flat 2D storage with `index_of`-style access and bounds checks | Life (weeks 1 and 2) and Tetris (week 4) both need a flat grid; Snake does not |

Each header here is single-file, has `#pragma once`, no dependencies outside the standard library, and
a doctest file next to it in `common/tests/` once the folder exists.
