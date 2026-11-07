// life_test.cpp — the acceptance tests for Week 1. Make every CHECK pass.
//
// Run:  cmake --build build && ./build/life_tests
// Each TEST_CASE is one small claim about one function. Read the failing
// message: it prints the expression, and the values it saw.

#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include "life.hpp"

// Small helper used by the tests only: a grid with a list of live (x, y) cells.
static Cells grid_with(int width, int height, std::initializer_list<std::pair<int, int>> alive) {
    Cells cells(static_cast<std::size_t>(width) * static_cast<std::size_t>(height), 0);
    for (auto [x, y] : alive) {
        cells[static_cast<std::size_t>(y * width + x)] = 1;
    }
    return cells;
}

// ---------------------------------------------------------------- milestone 1
TEST_CASE("index_of: row-major flat index") {
    CHECK(index_of(0, 0, 10) == 0);
    CHECK(index_of(9, 0, 10) == 9);
    CHECK(index_of(0, 1, 10) == 10);
    CHECK(index_of(3, 2, 10) == 23);
    CHECK(index_of(4, 4, 5) == 24);
}

// ---------------------------------------------------------------- milestone 2
TEST_CASE("random_cells: size, determinism and fill extremes") {
    Cells a = random_cells(8, 4, 42, 0.5);
    CHECK(a.size() == 32);

    Cells b = random_cells(8, 4, 42, 0.5);
    CHECK(a == b);  // same seed, same grid

    Cells dead = random_cells(8, 4, 1, 0.0);
    int live = 0;
    for (std::uint8_t c : dead) live += c;
    CHECK(live == 0);

    Cells full = random_cells(8, 4, 1, 1.0);
    live = 0;
    for (std::uint8_t c : full) live += c;
    CHECK(live == 32);

    Cells half = random_cells(100, 100, 7, 0.5);
    live = 0;
    for (std::uint8_t c : half) {
        CHECK((c == 0 || c == 1));
        live += c;
    }
    CHECK(live > 4000);
    CHECK(live < 6000);
}

TEST_CASE("render: '#' alive, '.' dead, newline after every row") {
    Cells g = grid_with(3, 2, {{0, 0}, {2, 1}});
    CHECK(render(g, 3, 2) == "#..\n..#\n");

    Cells empty(4, 0);
    CHECK(render(empty, 2, 2) == "..\n..\n");
}

// ---------------------------------------------------------------- milestone 3
TEST_CASE("wrap: like a clock face") {
    CHECK(wrap(0, 10) == 0);
    CHECK(wrap(7, 10) == 7);
    CHECK(wrap(10, 10) == 0);
    CHECK(wrap(11, 10) == 1);
    CHECK(wrap(-1, 10) == 9);
    CHECK(wrap(-10, 10) == 0);
    CHECK(wrap(-11, 10) == 9);
}

TEST_CASE("count_neighbours: interior cell") {
    // 5x5, a ring of 8 around the centre (2,2)
    Cells g = grid_with(5, 5, {{1, 1}, {2, 1}, {3, 1}, {1, 2}, {3, 2}, {1, 3}, {2, 3}, {3, 3}});
    CHECK(count_neighbours(g, 5, 5, 2, 2) == 8);
    CHECK(count_neighbours(g, 5, 5, 0, 0) == 1);  // only (1,1) touches the corner
    CHECK(count_neighbours(g, 5, 5, 2, 0) == 3);  // (1,1) (2,1) (3,1)
}

TEST_CASE("count_neighbours: does not count the cell itself") {
    Cells g = grid_with(3, 3, {{1, 1}});
    CHECK(count_neighbours(g, 3, 3, 1, 1) == 0);
    CHECK(count_neighbours(g, 3, 3, 0, 0) == 1);
}

TEST_CASE("count_neighbours: edges wrap around (torus)") {
    // Live cell at the far right of row 0; the cell at x=0 must see it.
    Cells g = grid_with(5, 3, {{4, 0}});
    CHECK(count_neighbours(g, 5, 3, 0, 0) == 1);
    CHECK(count_neighbours(g, 5, 3, 0, 1) == 1);
    CHECK(count_neighbours(g, 5, 3, 0, 2) == 1);  // wraps vertically too: row -1 is row 2

    // Live cell at bottom-right corner is a neighbour of top-left corner.
    Cells h = grid_with(4, 4, {{3, 3}});
    CHECK(count_neighbours(h, 4, 4, 0, 0) == 1);
}

// ---------------------------------------------------------------- milestone 4
TEST_CASE("step: a lone cell dies") {
    Cells cur = grid_with(5, 5, {{2, 2}});
    Cells next(25, 1);  // deliberately dirty: step must overwrite every cell
    step(cur, next, 5, 5);
    for (std::uint8_t c : next) CHECK(c == 0);
}

TEST_CASE("step: block is a still life") {
    Cells cur = grid_with(6, 6, {{2, 2}, {3, 2}, {2, 3}, {3, 3}});
    Cells next(36, 0);
    step(cur, next, 6, 6);
    CHECK(next == cur);
}

TEST_CASE("step: blinker oscillates with period 2") {
    Cells horizontal = grid_with(5, 5, {{1, 2}, {2, 2}, {3, 2}});
    Cells vertical = grid_with(5, 5, {{2, 1}, {2, 2}, {2, 3}});
    Cells next(25, 0);

    step(horizontal, next, 5, 5);
    CHECK(next == vertical);

    Cells again(25, 0);
    step(next, again, 5, 5);
    CHECK(again == horizontal);
}

TEST_CASE("step: birth with exactly three neighbours") {
    Cells cur = grid_with(5, 5, {{1, 1}, {2, 1}, {1, 2}});
    Cells next(25, 0);
    step(cur, next, 5, 5);
    CHECK(next[2 * 5 + 2] == 1);  // (2,2) is born
    CHECK(next[1 * 5 + 1] == 1);  // (1,1) survives with 2 neighbours
}

TEST_CASE("step: wraps across the edges") {
    // Horizontal blinker straddling the right/left edge of a 5-wide grid:
    // cells at x = 4, 0, 1 on row 2. Next generation: vertical at x = 0.
    Cells cur = grid_with(5, 5, {{4, 2}, {0, 2}, {1, 2}});
    Cells next(25, 0);
    step(cur, next, 5, 5);
    CHECK(next == grid_with(5, 5, {{0, 1}, {0, 2}, {0, 3}}));
}

TEST_CASE("step: does not modify current") {
    Cells cur = grid_with(4, 4, {{1, 1}, {2, 1}, {1, 2}, {2, 2}});
    Cells copy = cur;
    Cells next(16, 0);
    step(cur, next, 4, 4);
    CHECK(cur == copy);
}
