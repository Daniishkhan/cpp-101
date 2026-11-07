# CMakeLists.txt — the recipe that turns the source files in this folder into
# three programs: `snake`, `snake_tests`, `snake_bench`.
#
# Configure once, then build as often as you like:
#   cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Debug
#   cmake --build build
#   ./build/snake_tests
#
# Week 1 book chapter 11 explains every line below; the only new idea here is a program made from
# three source files (snake = main.cpp + snake.cpp + terminal.cpp).

cmake_minimum_required(VERSION 3.25)
project(snake LANGUAGES CXX)

# Which C++ we speak: C++23, and nothing vendor-specific.
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Writes build/compile_commands.json so editors (VS Code, clangd) understand the project.
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Default to a Debug build if nobody said otherwise.
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Debug)
endif()

# Warnings are free bug reports: turn them all on.
add_compile_options(-Wall -Wextra -Wpedantic)

# In Debug builds, the sanitizers turn memory bugs into readable error messages.
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
  add_compile_options(-fsanitize=address,undefined -fno-omit-frame-pointer)
  add_link_options(-fsanitize=address,undefined)
endif()

# Every program here can #include "snake.hpp", "terminal.hpp" and "doctest.h".
include_directories(src ${CMAKE_CURRENT_SOURCE_DIR}/../../third_party/doctest)

# The three programs. Each one is made from the listed source files. Only the game itself needs
# terminal.cpp: the tests and the benchmark run without a keyboard.
add_executable(snake       src/main.cpp         src/snake.cpp src/terminal.cpp)
add_executable(snake_tests tests/snake_test.cpp src/snake.cpp)
add_executable(snake_bench bench/bench_snake.cpp src/snake.cpp)

# Lets `ctest --test-dir build` run the tests too.
enable_testing()
add_test(NAME snake_tests COMMAND snake_tests)
