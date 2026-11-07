# Environment report and setup guide

Inspected on **7 Nov 2026** on the machine this curriculum starts on. Everything Week 1 needs is
already present. Two developer-comfort tools (clang-format, clang-tidy) are installed but not on your
PATH, one week 6 library (Google Benchmark) is missing, and the full Xcode app (for Instruments, week 6) is
not installed. The fixes take under five minutes, except the Xcode download, which takes an evening.
Week numbers follow the 7 Nov 2026 revision of [goal.md](../goal.md).

If you are reading this on a different machine, run the [verification checklist](#5-minute-verification-checklist)
and fix whatever fails.

## What is present

| Thing | Found | Where | Needed from | Notes |
|---|---|---|---|---|
| Machine | Apple M5, 10 cores, 24 GB RAM | | week 1 | Plenty for everything up to week 21 (SmolLM2-135M on CPU: 540 MB in fp32) |
| macOS | 26.7.2 | | week 1 | |
| Compiler | Apple clang 21.0.0 (`clang-2100.1.1.101`) | `/usr/bin/clang++` | week 1 | C++23 verified: `__cplusplus` is `202302L`; `<print>`, `<expected>`, `<span>` compile and run |
| Build | CMake 4.4.5 | Homebrew | week 1 | `cmake_minimum_required(VERSION 3.25)` in every challenge is satisfied |
| Build | Ninja 1.13.2 | Homebrew | week 1 | |
| Version control | git 2.50.1 (Apple Git-155) | `/usr/bin/git` | week 1 | |
| GitHub CLI | `gh`, logged in as `Daniishkhan` | Homebrew | week 1 | For creating the public repo and later PRs |
| Package manager | Homebrew 7.0.12 | `/opt/homebrew` | week 1 | |
| LLVM toolchain | LLVM 23.1.5 (`clang-format`, `clang-tidy`, `clangd`, LLVM `clang++`) | `/opt/homebrew/opt/llvm/bin` | week 1 | Installed but **not on PATH**, see below |
| Debugger | lldb (`lldb-2100.0.17.203`) | Xcode command line tools | week 3 | Taught in the Snake week; checkpoints in Buffer A, weeks 11, 17, 22 |
| Sanitizers | AddressSanitizer + UndefinedBehaviorSanitizer | Apple clang | week 1 | Verified: a deliberate heap overflow prints a readable `heap-buffer-overflow` report |
| Tests | doctest 2.5.3 (single header) | `third_party/doctest/doctest.h` | week 1 | Vendored; nothing to install |
| Containers | Docker 29.8.2, OrbStack 2.2.5 | | week 6 | **arm64** Linux parity (OrbStack Ubuntu 24.04): cachegrind, gdb, the arm64 deployment target. A container on Apple Silicon has **no AVX2 and no hardware performance counters**; counters come from Instruments on the Mac |
| Python | 3.9.6 (system) | `/usr/bin/python3` | week 1 (book tools) | Fine for `http.server` and the book checker. Too old for PyTorch: a Homebrew Python 3.12+ venv (PyTorch, NumPy, safetensors, onnx, tokenisers) is required from Mon 14 Dec 2026 (week 6), see below |
| Smoke build | `phase1-terminal/01-life` configures and builds with CMake + Ninja | | | 13 test cases run, 12 fail: exactly what a stubbed Week 1 should look like |

## What is missing, and the fix

### 1. `clang-format` and `clang-tidy` are not on PATH (needed in week 1 for the pre-commit hook)

Both binaries exist at `/opt/homebrew/opt/llvm/bin/`. Homebrew does not link LLVM into
`/opt/homebrew/bin` because its `clang++` would shadow Apple's.

The obvious fix is to add the whole LLVM `bin` directory to your PATH in `~/.zshrc`:

```sh
export PATH="/opt/homebrew/opt/llvm/bin:$PATH"
```

**Caveat:** that line also puts Homebrew's `clang++` (LLVM 23) ahead of Apple's `clang++` (21). The
book, the tests and the `tools/run.sh` script were verified with Apple clang, and the two compilers link
against different C++ standard libraries. Avoid the surprise. Instead, expose only the two tools you want.

Option A, symlink just those two into a directory that is already on PATH (recommended, works for
scripts and editors too):

```sh
ln -s /opt/homebrew/opt/llvm/bin/clang-format /opt/homebrew/bin/clang-format
ln -s /opt/homebrew/opt/llvm/bin/clang-tidy   /opt/homebrew/bin/clang-tidy
```

Option B, shell aliases in `~/.zshrc` (works at the prompt only, not inside scripts or editors):

```sh
alias clang-format=/opt/homebrew/opt/llvm/bin/clang-format
alias clang-tidy=/opt/homebrew/opt/llvm/bin/clang-tidy
```

`tools/install-hooks.sh` falls back to the full `/opt/homebrew/opt/llvm/bin/clang-format` path if the
command is not on PATH, so the hook works either way.

### 2. Google Benchmark is not installed (needed from week 6)

Weeks 1 and 2 use a hand-written `std::chrono` benchmark on purpose (book chapter 13). Install this when
week 6 starts (Mon 14 Dec 2026), not before:

```sh
brew install google-benchmark
```

### 3. Python 3.9.6 is the macOS system Python (a venv is required from week 6)

Fine for `python3 -m http.server` and `tools/book-check.py`. From Mon 14 Dec 2026 (week 6) the
model-literacy notes, the Buffer B reference dumps (`tools/dump_reference.py`) and the Phase 4 oracles need
a current Python with PyTorch, NumPy, safetensors, onnx and tokenisers in a venv:

```sh
brew install python
```

### 4. The pre-commit hook is not installed yet

After `git init` (or a clone), run once:

```sh
tools/install-hooks.sh
```

It installs `.git/hooks/pre-commit`, which refuses a commit whose staged `.cpp`/`.hpp` files are not
clang-formatted.

## 5-minute verification checklist

Run each command from the repo root. The expected output is what this machine printed on 7 Nov 2026;
version numbers may be newer on yours.

```sh
$ clang++ --version | head -1
Apple clang version 21.0.0 (clang-2100.1.1.101)

$ echo '__cplusplus' | clang++ -std=c++23 -E -x c++ - | tail -1
202302L

$ cmake --version | head -1
cmake version 4.4.5

$ ninja --version
1.13.2

$ git --version
git version 2.50.1 (Apple Git-155)

$ gh auth status 2>&1 | head -2
github.com
  ✓ Logged in to github.com account Daniishkhan (keyring)

$ /opt/homebrew/opt/llvm/bin/clang-format --version
Homebrew clang-format version 23.1.5

$ lldb --version
lldb-2100.0.17.203
```

Now prove that the compiler, the sanitizers and the build system agree. Create a scratch file:

```sh
$ mkdir -p scratch && cat > scratch/overflow.cpp <<'EOF'
#include <print>
#include <vector>
int main() {
    std::vector<int> v(3, 0);
    int* p = v.data();
    std::println("{}", p[3]);   // one past the end: a bug on purpose
    return 0;
}
EOF
$ tools/run.sh scratch/overflow.cpp 2>&1 | head -2
=================================================================
==52731==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x6020000000dc ...
```

If you see the `AddressSanitizer: heap-buffer-overflow` line, the sanitizers work. Finally the smoke
build of the Week 1 challenge:

```sh
$ cd phase1-terminal/01-life
$ cmake -S . -B build -G Ninja
-- Build files have been written to: .../phase1-terminal/01-life/build
$ cmake --build build
[9/9] Linking CXX executable life_tests
$ ./build/life_tests | tail -3
[doctest] test cases:    13 |     1 passed | 12 failed | 0 skipped
[doctest] assertions: 10061 | 10010 passed | 51 failed |
[doctest] Status: FAILURE!
```

Twelve failing test cases is the correct starting state. Your week is the journey from here to
`13 passed`.

## When you need a Linux box

| Weeks | Where to run | Why |
|---|---|---|
| 1 to 5 | This Mac; CI on the `macos-26` runner | Apple clang, lldb, ASan/UBSan, ANSI terminal: everything is local |
| 6 to 10 | This Mac plus an **arm64** Linux machine (`orb create ubuntu:noble`, OrbStack already installed); `ubuntu-24.04` and `ubuntu-24.04-arm` runners on CI | cachegrind (a cache simulator), gdb, glibc parity and the arm64 deployment target. **Not** AVX2 and **not** `perf stat`: a container on Apple Silicon is arm64 and the VM hides the performance counters. Cycles, IPC and cache misses come from Instruments (`xcrun xctrace`, CPU Counters) on the Mac, which needs the full Xcode app (item 4 below). Install LLVM 20 from apt.llvm.org in the container (`clang++-20 -stdlib=libc++`) |
| 11 to 14 | This Mac | NEON, ThreadSanitizer, the roofline. AVX2 ports are proved correct on the free x86 CI runner; AVX2 timings and `perf stat` only on rented bare metal, as a week 12 stretch |
| 15 to 21 | This Mac; the container for the week 17 arm64 Linux binary | A 135M-parameter model in fp32 is about 540 MB; 24 GB is plenty |
| 22 to 26 | A rented Nvidia GPU (RunPod or Vast.ai; a 4090 is enough) for CUDA; this Mac for Metal and the simulated accelerator | Apple Silicon has no CUDA. Develop on the Mac, `rsync` to the box, build and run there. Budget 12 to 15 GPU hours a week, 50 to 60 in total |
| 27 to 30 | This Mac (llama.cpp on Metal as the baseline), the container as the edge-Linux check | Reading and contributing to llama.cpp |

You do not need any virtual machine for weeks 1 to 5. Do not spend setup time on one yet.

### 4. The full Xcode app is not installed (needed from week 6 for Instruments)

Only the Command Line Tools are present (`xcode-select -p` prints `/Library/Developer/CommandLineTools`,
and `xcrun --find xctrace` fails). Instruments, `xctrace` and the CPU Counters template ship only with the
full Xcode app. Start the download on Sat 28 Nov 2026 (it is large) so it is ready for Mon 14 Dec. After
installing, point the tools at it and check:

```sh
sudo xcode-select -s /Applications/Xcode.app
xcrun --find xctrace
```

## VS Code and clangd in six lines

1. Install the **clangd** extension (llvm-vs-code-extensions.vscode-clangd) and disable the Microsoft
   C/C++ IntelliSense engine if it is installed (they fight).
2. Point it at the Homebrew clangd: in settings, `"clangd.path": "/opt/homebrew/opt/llvm/bin/clangd"`.
   (`/usr/bin/clangd` also exists and works; the Homebrew one matches `.clang-tidy` better.)
3. Every challenge's `CMakeLists.txt` sets `CMAKE_EXPORT_COMPILE_COMMANDS ON`, so after you configure
   a build, `build/compile_commands.json` exists.
4. Tell clangd where it is: `"clangd.arguments": ["--compile-commands-dir=build"]`, or symlink it to
   the challenge root with `ln -s build/compile_commands.json .` (that path is git-ignored).
5. Open the **challenge folder** (for example `phase1-terminal/01-life`) as the workspace, not the repo
   root, so the paths line up.
6. The repo's `.clang-format` and `.clang-tidy` are picked up automatically; format-on-save is
   `"editor.formatOnSave": true`.
