#!/usr/bin/env bash
# new-challenge.sh — scaffold a new challenge folder from the 01-life layout.
#
#   tools/new-challenge.sh <phase-dir> <NN-slug> <name>
#   tools/new-challenge.sh phase1-terminal 02-snake snake
#
# Creates <repo>/<phase-dir>/<NN-slug>/ with:
#   README.md            the spec skeleton (same headings as 01-life/README.md), to fill in BEFORE coding
#   CMakeLists.txt       a copy of 01-life's with the target names replaced
#   src/<name>.hpp       #pragma once, empty contract
#   src/<name>.cpp       includes the header, nothing else yet
#   src/main.cpp         a hello stub so the project builds on day one
#   tests/<name>_test.cpp  doctest main + one TEST_CASE that fails on purpose
#   BENCH.md             the numbers table
#
# <phase-dir> may be a name relative to the repo root (phase1-terminal) or an absolute path
# (/private/tmp/somewhere); the folder is created if it does not exist.
set -euo pipefail

usage() {
    echo "usage: tools/new-challenge.sh <phase-dir> <NN-slug> <name>" >&2
    echo "   eg: tools/new-challenge.sh phase1-terminal 02-snake snake" >&2
    exit 2
}

[ $# -eq 3 ] || usage
phase="$1"
slug="$2"
name="$3"

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
template="$repo/phase1-terminal/01-life"

case "$name" in
    *[!a-z0-9_]*|"") echo "error: <name> must be snake_case (a-z, 0-9, _): got '$name'" >&2; exit 2 ;;
esac
case "$slug" in
    [0-9][0-9]-*) ;;
    *) echo "error: <NN-slug> must look like 02-snake: got '$slug'" >&2; exit 2 ;;
esac

case "$phase" in
    /*) phase_dir="$phase" ;;
    *)  phase_dir="$repo/$phase" ;;
esac
dir="$phase_dir/$slug"

if [ -e "$dir" ]; then
    echo "error: $dir already exists; refusing to overwrite" >&2
    exit 1
fi
[ -f "$template/CMakeLists.txt" ] || { echo "error: template $template not found" >&2; exit 1; }

# Depth of the challenge folder relative to the repo root decides the path to third_party.
# In-repo: <phase>/<slug> is two levels down. Out-of-repo (absolute path): use the absolute repo path.
case "$dir" in
    "$repo"/*) doctest_rel='${CMAKE_CURRENT_SOURCE_DIR}/../../third_party/doctest' ;;
    *)         doctest_rel="$repo/third_party/doctest" ;;
esac

mkdir -p "$dir/src" "$dir/tests" "$dir/bench"
today="$(date +%Y-%m-%d)"
title="$(printf '%s' "$name" | sed 's/_/ /g')"

# ---------------------------------------------------------------- README.md
cat > "$dir/README.md" <<EOF
# $slug: $title

**Week N** (dates) · Phase · Book: (link if there is one)

> Spec skeleton created $today by tools/new-challenge.sh. Fill every section in the 20-minute spec
> ritual (docs/methodology.md) BEFORE writing code. Then the spec is frozen.

## Concept

What you build, in one paragraph. Which C++ you learn this week.

Concepts introduced and reused: cite the rows in CONCEPTS.md.

## Inference twin

- What inference concept this challenge is secretly teaching, and why the code shape is the same.

## Spec

| Argument | Meaning | Default |
|---|---|---|
| \`--example N\` | | |

Behaviour:

- Concrete, testable statements. Numbers, not adjectives.

## The contract

[\`src/$name.hpp\`](src/$name.hpp) declares the functions. You write the definitions in
[\`src/$name.cpp\`](src/$name.cpp) and the program in [\`src/main.cpp\`](src/main.cpp).

| Function | One line |
|---|---|
| | |

### Milestones

| | Milestone | Turns green |
|---|---|---|
| **M1** | | |
| **M2** | | |

## Acceptance tests

- [ ] \`./build/${name}_tests\` reports all passed in a Debug build (sanitizers on).
- [ ] The program does what the spec says, by hand.
- [ ] [BENCH.md](BENCH.md) has numbers with machine and date.
- [ ] One commit per milestone.
- [ ] Review run; the three questions answered in the week log.

## Stretch goals (only after the gate is passed)

1.
2.

## Build and run

\`\`\`sh
cd $phase/$slug
cmake -S . -B build -G Ninja
cmake --build build
./build/${name}_tests
./build/$name

cmake -S . -B build-release -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build-release && ./build-release/${name}_bench
\`\`\`

## Files

\`\`\`
README.md              this file
CMakeLists.txt         build recipe
BENCH.md               your numbers
src/$name.hpp          the contract
src/$name.cpp          YOUR implementation
src/main.cpp           YOUR program
tests/${name}_test.cpp   doctest cases
bench/bench_$name.cpp  timing harness (add when the week needs one)
\`\`\`
EOF

# ---------------------------------------------------------------- CMakeLists.txt
# Copy 01-life's recipe and rename the targets and files. The bench target is kept but points at a
# bench file you add later; it is commented out so the folder builds on day one.
sed \
    -e "s/project(life LANGUAGES CXX)/project($name LANGUAGES CXX)/" \
    -e "s/three programs: \`life\` (the game), \`life_tests\` (the tests), \`life_bench\`/three programs: \`$name\`, \`${name}_tests\`, \`${name}_bench\`/" \
    -e "s/#include \"life.hpp\"/#include \"$name.hpp\"/" \
    -e "s|include_directories(src \${CMAKE_CURRENT_SOURCE_DIR}/../../third_party/doctest)|include_directories(src $doctest_rel)|" \
    -e "s/add_executable(life       src\/main.cpp        src\/life.cpp)/add_executable($name       src\/main.cpp        src\/$name.cpp)/" \
    -e "s/add_executable(life_tests tests\/life_test.cpp src\/life.cpp)/add_executable(${name}_tests tests\/${name}_test.cpp src\/$name.cpp)/" \
    -e "s/add_executable(life_bench bench\/bench_life.cpp src\/life.cpp)/# add_executable(${name}_bench bench\/bench_$name.cpp src\/$name.cpp)   # uncomment when bench\/ exists/" \
    -e "s/add_test(NAME life_tests COMMAND life_tests)/add_test(NAME ${name}_tests COMMAND ${name}_tests)/" \
    -e "s/\.\/build\/life_tests/.\/build\/${name}_tests/" \
    "$template/CMakeLists.txt" > "$dir/CMakeLists.txt"

# ---------------------------------------------------------------- src/
cat > "$dir/src/$name.hpp" <<EOF
#pragma once
// $name.hpp — the contract for $slug.
//
// This header DECLARES the functions. You write the DEFINITIONS in $name.cpp.
// The tests in tests/${name}_test.cpp call these exact names and signatures.
// Write the declarations and their comments during the spec ritual, before any code.

#include <cstdint>
#include <string>
#include <vector>
EOF

cat > "$dir/src/$name.cpp" <<EOF
// $name.cpp — YOUR implementation of the functions declared in $name.hpp.
//
// Each function starts as a stub that compiles but returns the wrong answer, so the tests start RED.
// Turn them GREEN one milestone at a time.

#include "$name.hpp"
EOF

cat > "$dir/src/main.cpp" <<EOF
// main.cpp — the program people run. This stub exists so the project builds on day one.

#include <print>

int main(int argc, char* argv[]) {
    std::println("$name: not implemented yet ({} arguments given)", argc - 1);
    (void)argv;
    return 0;
}
EOF

# ---------------------------------------------------------------- tests/
cat > "$dir/tests/${name}_test.cpp" <<EOF
// ${name}_test.cpp — the acceptance tests for $slug. Make every CHECK pass.
//
// Run:  cmake --build build && ./build/${name}_tests

#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include "$name.hpp"

TEST_CASE("$name: the first test has not been written yet") {
    MESSAGE("write the first test");
    CHECK(false);
}
EOF

# ---------------------------------------------------------------- BENCH.md
cat > "$dir/BENCH.md" <<EOF
# BENCH — $slug

| Date | Machine | Build | Size | Metric | Value | Notes |
|------|---------|-------|------|--------|-------|-------|
|      |         |       |      |        |       |       |

Record at least:
- Debug (\`-DCMAKE_BUILD_TYPE=Debug\`, sanitizers on)
- Release (\`-DCMAKE_BUILD_TYPE=Release\`)
- One experiment of your choice with a sentence on what you expected and what happened
EOF

echo "created $dir"
echo
echo "next:"
echo "  1. fill in $dir/README.md (the 20-minute spec ritual)"
echo "  2. write the declarations in src/$name.hpp and stubs in src/$name.cpp"
echo "  3. cd $dir && cmake -S . -B build -G Ninja && cmake --build build && ./build/${name}_tests"
