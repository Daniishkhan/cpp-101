// life.cpp — YOUR implementation of the functions declared in life.hpp.
//
// Every function below is a stub: it compiles, but returns the wrong answer,
// so the tests start RED. Your job this week is to turn them GREEN, one at a
// time, in the order they appear. The book (docs/book/week1) walks you to
// each one. Do not look at a solution; use the hint ladders in chapter 14.

#include "life.hpp"

int index_of(int x, int y, int width) {
    // TODO(you): milestone 1
    (void)x;
    (void)y;
    (void)width;
    return 0;
}

int wrap(int v, int n) {
    // TODO(you): milestone 3 — careful with negative numbers
    (void)v;
    (void)n;
    return 0;
}

int count_neighbours(const Cells& cells, int width, int height, int x, int y) {
    // TODO(you): milestone 3
    (void)cells;
    (void)width;
    (void)height;
    (void)x;
    (void)y;
    return 0;
}

void step(const Cells& current, Cells& next, int width, int height) {
    // TODO(you): milestone 4
    (void)current;
    (void)next;
    (void)width;
    (void)height;
}

Cells random_cells(int width, int height, unsigned int seed, double fill) {
    // TODO(you): milestone 2
    (void)seed;
    (void)fill;
    return Cells(static_cast<std::size_t>(width) * static_cast<std::size_t>(height), 0);
}

std::string render(const Cells& cells, int width, int height) {
    // TODO(you): milestone 2
    (void)cells;
    (void)width;
    (void)height;
    return "";
}
