#!/usr/bin/env bash
# run.sh — compile ONE C++ file with the Week 1 flags and run it.
#   tools/run.sh scratch/hello.cpp            # compile + run
#   tools/run.sh scratch/hello.cpp arg1 arg2  # pass arguments to the program
# Flags: C++23, all warnings, AddressSanitizer + UndefinedBehaviorSanitizer (so memory bugs
# become readable messages instead of silent nonsense). The binary goes to /tmp, not next to your source.
set -euo pipefail
if [ $# -lt 1 ]; then echo "usage: tools/run.sh FILE.cpp [program arguments...]" >&2; exit 2; fi
src="$1"; shift
out="/tmp/cpp101-$(basename "${src%.*}")-$$"
clang++ -std=c++23 -Wall -Wextra -g -fsanitize=address,undefined -fno-omit-frame-pointer "$src" -o "$out"
"$out" "$@"
status=$?
rm -f "$out"
exit $status
