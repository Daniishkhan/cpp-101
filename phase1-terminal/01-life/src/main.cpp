// main.cpp — the program people run: `./build/life --width 80 --height 24 --seed 7`
//
// This is a stub so the project builds on day one. You replace it in
// milestones 5 and 6 of the challenge (see README.md and book chapter 14):
//   1. parse --width, --height, --seed, --fill, --fps, --steps from argv
//   2. make two Cells vectors (current and next) with random_cells
//   3. loop: clear screen, print render(current), step into next, swap, sleep
//   4. show the cursor again before exiting

#include <print>

int main(int argc, char* argv[]) {
    std::println("life: not implemented yet ({} arguments given)", argc - 1);
    (void)argv;
    return 0;
}
