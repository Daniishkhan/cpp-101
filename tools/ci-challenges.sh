#!/usr/bin/env bash
# ci-challenges.sh — build and test every challenge exactly the way CI does.
#
# For each folder under phase*/ that has a CMakeLists.txt, it runs:
#   1. a Debug build (warnings on, AddressSanitizer + UBSan on: the default in every challenge),
#      then the tests through ctest;
#   2. a Release build, so the benchmark also compiles with optimisation on.
# A build failure and a test failure are reported separately, and the script keeps going after
# one, so a red challenge never hides another. It exits 1 if anything failed.
#
# It uses its own build folders (build-ci/, build-ci-release/), so your build/ is never touched.
#
# Usage:  tools/ci-challenges.sh                              # every challenge
#         tools/ci-challenges.sh phase1-terminal/01-life      # just one
set -uo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root" || exit 1

dirs=()
if [ $# -gt 0 ]; then
    dirs=("$@")
else
    while IFS= read -r f; do dirs+=("$(dirname "$f")"); done \
        < <(find phase* -mindepth 2 -maxdepth 2 -name CMakeLists.txt 2>/dev/null | sort)
fi
if [ ${#dirs[@]} -eq 0 ]; then
    echo "ci-challenges: no challenge folders found under phase*/" >&2
    exit 1
fi

logs="$(mktemp -d)"
rows=()
failed=0

for d in "${dirs[@]}"; do
    name="$(basename "$d")"
    echo
    echo "=== $d"
    debug="$d/build-ci"
    release="$d/build-ci-release"

    if ! cmake -S "$d" -B "$debug" -G Ninja -DCMAKE_BUILD_TYPE=Debug >"$logs/$name.cfg" 2>&1 \
        || ! cmake --build "$debug" 2>&1 | tee "$logs/$name.build"; then
        cat "$logs/$name.cfg"
        rows+=("| \`$d\` | **build failed** (Debug) | | |")
        failed=1
        continue
    fi
    warnings=$(grep -c 'warning:' "$logs/$name.build" || true)

    if ctest --test-dir "$debug" --output-on-failure 2>&1 | tee "$logs/$name.test"; then
        tests="green"
    else
        tests="**red**"
        failed=1
    fi
    # doctest prints "[doctest] test cases:    13 |     1 passed | 12 failed | ...": keep the numbers only,
    # because a '|' would break the Markdown table below.
    line=$(grep -E '\[doctest\] test cases:' "$logs/$name.test" | tail -n 1)
    if [ -n "$line" ]; then
        total=$(sed -E 's/.*test cases: *([0-9]+).*/\1/' <<<"$line")
        passed=$(sed -E 's/.*\| *([0-9]+) passed.*/\1/' <<<"$line")
        cases="$passed of $total test cases pass"
    else
        cases="no doctest summary; see the log"
    fi

    if cmake -S "$d" -B "$release" -G Ninja -DCMAKE_BUILD_TYPE=Release >"$logs/$name.rcfg" 2>&1 \
        && cmake --build "$release" >"$logs/$name.rbuild" 2>&1; then
        rel="builds"
    else
        cat "$logs/$name.rcfg" "$logs/$name.rbuild"
        rel="**build failed**"
        failed=1
    fi

    rows+=("| \`$d\` | $tests: $cases | $warnings | $rel |")
done

summary="$(
    echo "## Challenges"
    echo
    echo "| Challenge | Tests (Debug, sanitizers on) | Warnings | Release |"
    echo "|---|---|---|---|"
    printf '%s\n' "${rows[@]}"
    echo
    echo "Red tests are the normal state while a challenge is in progress: the stubs return wrong answers"
    echo "until you write them. A build failure is never normal."
)"
echo
echo "$summary"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    echo "$summary" >>"$GITHUB_STEP_SUMMARY"
fi

rm -rf "$logs"
exit $failed
