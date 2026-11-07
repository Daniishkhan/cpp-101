// bench_life.cpp — your first benchmark number.
//
// Build in Release and run:
//   cmake -S . -B build-release -G Ninja -DCMAKE_BUILD_TYPE=Release
//   cmake --build build-release && ./build-release/life_bench
// Then write the numbers into BENCH.md with the date and your machine.

#include <chrono>
#include <print>
#include <string>
#include <utility>

#include "life.hpp"

int main(int argc, char* argv[]) {
    int size = 1000;
    if (argc > 1) size = std::stoi(argv[1]);
    const int width = size;
    const int height = size;
    const int warmup_steps = 3;
    const int timed_steps = 20;

    Cells current = random_cells(width, height, 12345, 0.35);
    Cells next(current.size(), 0);

    for (int i = 0; i < warmup_steps; ++i) {
        step(current, next, width, height);
        std::swap(current, next);
    }

    using clock = std::chrono::steady_clock;
    const auto start = clock::now();
    for (int i = 0; i < timed_steps; ++i) {
        step(current, next, width, height);
        std::swap(current, next);
    }
    const auto end = clock::now();

    const double total_ms = std::chrono::duration<double, std::milli>(end - start).count();
    const double ms_per_step = total_ms / timed_steps;
    const double cells = static_cast<double>(width) * height;
    const double ns_per_cell = ms_per_step * 1e6 / cells;

    std::println("grid: {}x{} ({} cells)", width, height, static_cast<long long>(cells));
    std::println("steps timed: {} (after {} warm-up)", timed_steps, warmup_steps);
    std::println("ms per step:  {:.3f}", ms_per_step);
    std::println("ns per cell:  {:.3f}", ns_per_cell);
    std::println("cells per second: {:.1f} million", cells / (ms_per_step / 1000.0) / 1e6);
    return 0;
}
