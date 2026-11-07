// bench_snake.cpp — what one tick costs, and how fair the food is.
//
// Build in Release and run:
//   cmake -S . -B build-release -G Ninja -DCMAKE_BUILD_TYPE=Release
//   cmake --build build-release
//   ./build-release/snake_bench          # tick cost vs snake length, and render cost
//   ./build-release/snake_bench draws    # the Saturday maths strand: 10,000 food draws
// Then write the numbers into BENCH.md with the date, the machine and the build type.
//
// This harness only CALLS your functions (tick, render, place_food); it never does their work.
// Write the prediction in BENCH.md's Experiment section before you run it for the first time.

#include <chrono>
#include <cmath>
#include <format>
#include <optional>
#include <print>
#include <random>
#include <string>
#include <vector>

#include "snake.hpp"

using Clock = std::chrono::steady_clock;

// A straight snake of `length` cells lying on row 1 of a board that is wide enough for it to
// move right for `moves` ticks without reaching the wall. The food sits at (0, 0), off its path,
// so no tick eats and the length stays the same: every tick has to check the new head against
// the whole body.
static Game straight_snake(int length, int moves) {
    Game g;
    g.width = length + moves + 2;
    g.height = 3;
    for (int x = length - 1; x >= 0; --x) {
        g.body.push_back({x, 1});  // head first: x = length - 1 down to the tail at x = 0
    }
    g.heading = Direction::Right;
    g.food = {0, 0};
    return g;
}

// Nanoseconds per tick for a snake of `length` cells: the fastest of five runs, each run
// `ticks` timed ticks after a short warm-up. Returns a negative number if the snake did not do
// what the tests say it must (it died, or did not move: tick is still a stub, or a test fails).
static double ns_per_tick(int length, int ticks) {
    const int warmup = 100;
    const int runs = 5;
    std::mt19937 rng(1);
    double fastest = -1.0;
    for (int run = 0; run < runs; ++run) {
        Game g = straight_snake(length, warmup + ticks);
        for (int i = 0; i < warmup; ++i) {
            tick(g, std::nullopt, rng);
        }
        const auto start = Clock::now();
        for (int i = 0; i < ticks; ++i) {
            tick(g, std::nullopt, rng);
        }
        const auto end = Clock::now();
        const bool moved_right = !g.body.empty() && g.body.front().x == length - 1 + warmup + ticks;
        if (g.state != State::Playing || !moved_right ||
            g.body.size() != static_cast<std::size_t>(length)) {
            return -1.0;
        }
        const double ns = std::chrono::duration<double, std::nano>(end - start).count() / ticks;
        if (fastest < 0.0 || ns < fastest) {
            fastest = ns;
        }
    }
    return fastest;
}

// Microseconds per render of a width x height board with a snake of `length` cells (the fastest
// of five runs of 200 renders). Negative if render's output has the wrong size.
static double us_per_render(int width, int height, int length) {
    Game g;
    g.width = width;
    g.height = height;
    for (int i = 0; i < length; ++i) {
        g.body.push_back({width - 1 - i % width, i / width});  // in rows: render does not mind gaps
    }
    g.food = {0, height - 1};
    const std::size_t expected = static_cast<std::size_t>(width + 3) * (height + 2);
    double fastest = -1.0;
    std::size_t total = 0;  // used below, so the optimiser cannot skip the renders
    for (int run = 0; run < 5; ++run) {
        const auto start = Clock::now();
        for (int i = 0; i < 200; ++i) {
            const std::string frame = render(g);
            if (frame.size() != expected) {
                return -1.0;
            }
            total += frame.size();
        }
        const auto end = Clock::now();
        const double us = std::chrono::duration<double, std::micro>(end - start).count() / 200;
        if (fastest < 0.0 || us < fastest) {
            fastest = us;
        }
    }
    return total > 0 ? fastest : -1.0;
}

static int timing() {
    std::println("tick: time per tick against the length of the snake (fastest of 5 runs)");
    const std::vector<int> lengths = {10, 100, 1000, 10000, 100000};
    for (int length : lengths) {
        const int ticks = length >= 1000 ? 2000 : 2000000 / length;
        const double ns = ns_per_tick(length, ticks);
        if (ns < 0.0) {
            std::println("  length {:>6}: the snake did not move as the tests say it must.",
                         length);
            std::println("  Turn the tick tests green first (./build/snake_tests), then measure.");
            return 1;
        }
        std::println("  length {:>6}: {:>10.1f} ns per tick  ({:.3f} ns per cell of body)", length,
                     ns, ns / length);
    }

    std::println();
    std::println("render: time per frame (fastest of 5 runs of 200 frames)");
    const double small = us_per_render(30, 15, 20);
    const double large = us_per_render(200, 100, 2000);
    if (small < 0.0 || large < 0.0) {
        std::println(
            "  render returned a frame of the wrong size: turn the render tests green first.");
        return 1;
    }
    std::println("  30 x 15,   snake of 20:   {:>8.2f} us per frame", small);
    std::println("  200 x 100, snake of 2000: {:>8.2f} us per frame", large);

    std::println();
    const double work_us = ns_per_tick(20, 100000) / 1000.0 + small;
    const int fastest_tick = tick_ms(1000);
    std::println("one tick of work at 30 x 15 (tick + render): {:.2f} us", work_us);
    std::println("the shortest tick budget, tick_ms(1000): {} ms, so the work uses {:.4f}% of it",
                 fastest_tick, fastest_tick > 0 ? 100.0 * work_us / (fastest_tick * 1000.0) : 0.0);
    return 0;
}

// The Saturday maths strand: 10,000 food draws on an empty 10 x 10 board. Predict the expected
// count per cell and the typical distance from it BEFORE you run this, then compare.
static int draws() {
    const int size = 10;
    const int total = 10000;
    std::mt19937 rng(1);
    std::vector<std::vector<int>> counts(size, std::vector<int>(size, 0));  // counts[y][x]
    for (int i = 0; i < total; ++i) {
        const std::optional<Point> food = place_food(Body{}, size, size, rng);
        if (!food.has_value() || food->x < 0 || food->x >= size || food->y < 0 || food->y >= size) {
            std::println(
                "place_food gave no cell, or a cell off the board: turn its tests green first.");
            return 1;
        }
        counts[food->y][food->x] += 1;
    }
    std::println("{} food draws on an empty {} x {} board (seed 1). Count per cell:", total, size,
                 size);
    int lowest = total;
    int highest = 0;
    double squares = 0.0;
    const double expected = static_cast<double>(total) / (size * size);
    for (int y = 0; y < size; ++y) {
        std::string row = "  ";
        for (int x = 0; x < size; ++x) {
            const int c = counts[y][x];
            row += std::format("{:>5}", c);
            if (c < lowest) {
                lowest = c;
            }
            if (c > highest) {
                highest = c;
            }
            squares += (c - expected) * (c - expected);
        }
        std::println("{}", row);
    }
    std::println("expected per cell: {:.0f}", expected);
    std::println("lowest: {}   highest: {}", lowest, highest);
    std::println("typical distance from the expected count (standard deviation): {:.1f}",
                 std::sqrt(squares / (size * size)));
    return 0;
}

int main(int argc, char* argv[]) {
    if (argc > 1 && std::string(argv[1]) == "draws") {
        return draws();
    }
    return timing();
}
