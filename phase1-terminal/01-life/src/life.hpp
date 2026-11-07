#pragma once
// life.hpp — the contract for Week 1: Game of Life on a toroidal grid.
//
// This header DECLARES the functions. You write the DEFINITIONS in life.cpp.
// The tests in tests/life_test.cpp call these exact names and signatures,
// so keep them as they are. Everything else about the implementation is yours.
//
// Grid layout (the one idea this whole week is about):
//   A grid of `width` columns and `height` rows is stored as ONE flat vector
//   of width*height cells, row by row. The cell at column x, row y lives at
//       cells[y * width + x]
//   1 means alive, 0 means dead.

#include <cstdint>
#include <string>
#include <vector>

// A flat list of cells. (`using` gives a long type a short name.)
using Cells = std::vector<std::uint8_t>;

// The position in the flat vector of the cell at column x, row y.
//   index_of(0, 0, 10) == 0,  index_of(3, 2, 10) == 23
int index_of(int x, int y, int width);

// Wrap v into the range [0, n), like the hands of a clock.
//   wrap(-1, 10) == 9,  wrap(10, 10) == 0,  wrap(7, 10) == 7
int wrap(int v, int n);

// How many of the 8 neighbours of (x, y) are alive. The grid is a torus:
// the left edge touches the right edge, the top touches the bottom.
int count_neighbours(const Cells& cells, int width, int height, int x, int y);

// One generation of Life. Reads `current`, writes the result into `next`.
// Both vectors already have width*height cells. `current` is never modified.
//   Rules: a live cell with 2 or 3 live neighbours stays alive;
//          a dead cell with exactly 3 live neighbours becomes alive;
//          every other cell is dead in the next generation.
void step(const Cells& current, Cells& next, int width, int height);

// A random starting grid. Each cell is alive with probability `fill`
// (0.0 = all dead, 1.0 = all alive). The same seed must always give
// the same grid.
Cells random_cells(int width, int height, unsigned int seed, double fill);

// The grid as text, one row per line: '#' for alive, '.' for dead,
// and a '\n' after every row (including the last).
std::string render(const Cells& cells, int width, int height);
