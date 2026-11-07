#!/usr/bin/env bash
# run.sh — compile ONE C++ file with the Week 1 flags and run it.
#   tools/run.sh scratch/hello.cpp            # compile + run
#   tools/run.sh scratch/hello.cpp arg1 arg2  # pass arguments to the program
# Flags: C++23, all warnings, AddressSanitizer + UndefinedBehaviorSanitizer (so memory bugs
# become readable messages instead of silent nonsense). The binary goes to /tmp, not next to your
# source, and is deleted when the script ends, however it ends: the program succeeds, fails,
# crashes, or does not compile. With -g, clang on macOS also writes a folder of debug information
# next to the binary (NAME.dSYM); it goes too. The exit status is the program's (or clang's).
set -euo pipefail
if [ $# -lt 1 ]; then echo "usage: tools/run.sh FILE.cpp [program arguments...]" >&2; exit 2; fi
src="$1"; shift
out="/tmp/cpp101-$(basename "${src%.*}")-$$"
trap 'rm -rf "$out" "$out.dSYM"' EXIT
clang++ -std=c++23 -Wall -Wextra -g -fsanitize=address,undefined -fno-omit-frame-pointer "$src" -o "$out"
"$out" "$@"
