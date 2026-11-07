#!/usr/bin/env bash
# install-hooks.sh — install the repo's git hooks into .git/hooks. Run once per clone:
#   tools/install-hooks.sh
#
# Installs:
#   pre-commit  refuses a commit if any staged .cpp/.hpp file is not clang-formatted
#               (uses clang-format from PATH, or /opt/homebrew/opt/llvm/bin/clang-format as a fallback)
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
git_dir="$(git -C "$repo" rev-parse --git-dir 2>/dev/null)" || {
    echo "error: $repo is not a git repository (run 'git init' first)" >&2
    exit 1
}
case "$git_dir" in
    /*) ;;
    *) git_dir="$repo/$git_dir" ;;
esac
hooks="$git_dir/hooks"
mkdir -p "$hooks"

cat > "$hooks/pre-commit" <<'EOF'
#!/usr/bin/env bash
# pre-commit — installed by tools/install-hooks.sh. Checks that staged C++ files are clang-formatted.
set -uo pipefail

if command -v clang-format >/dev/null 2>&1; then
    CF="clang-format"
elif [ -x /opt/homebrew/opt/llvm/bin/clang-format ]; then
    CF="/opt/homebrew/opt/llvm/bin/clang-format"
else
    echo "pre-commit: clang-format not found (PATH or /opt/homebrew/opt/llvm/bin). See docs/setup.md." >&2
    echo "pre-commit: to commit anyway once:  git commit --no-verify" >&2
    exit 1
fi

# Staged (added/copied/modified/renamed) C++ files only. Vendored code in third_party/ is never
# reformatted, so it is not checked.
files=()
while IFS= read -r -d '' f; do
    files+=("$f")
done < <(git diff --cached --name-only --diff-filter=ACMR -z -- '*.cpp' '*.hpp' '*.cc' '*.h' ':(exclude)third_party/**')

[ ${#files[@]} -eq 0 ] && exit 0

bad=()
for f in "${files[@]}"; do
    # Check the STAGED content, not the working tree, so partial stages are judged correctly.
    if ! git show ":$f" | "$CF" --dry-run --Werror --assume-filename="$f" >/dev/null 2>&1; then
        bad+=("$f")
    fi
done

[ ${#bad[@]} -eq 0 ] && exit 0

echo "pre-commit: these staged files are not clang-formatted:" >&2
for f in "${bad[@]}"; do echo "    $f" >&2; done
echo >&2
echo "fix:    $CF -i ${bad[*]} && git add ${bad[*]}" >&2
echo "bypass this once (not recommended):  git commit --no-verify" >&2
exit 1
EOF
chmod +x "$hooks/pre-commit"

echo "installed $hooks/pre-commit"
if command -v clang-format >/dev/null 2>&1; then
    echo "clang-format: $(command -v clang-format)"
elif [ -x /opt/homebrew/opt/llvm/bin/clang-format ]; then
    echo "clang-format: /opt/homebrew/opt/llvm/bin/clang-format (not on PATH; hook uses the full path)"
else
    echo "warning: clang-format not found; the hook will refuse every C++ commit until it is installed" >&2
fi
