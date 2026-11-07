// main.cpp — the program people run: `./build/snake --width 30 --height 15`
//
// This is a stub so the project builds on day one. You replace it in milestone 6 (README.md and
// book chapter 9). The plan, in words:
//   1. parse --width, --height and --seed from argv (your Life parser is a good start)
//   2. make the random engine and the game (new_game)
//   3. ask for Ctrl-C to set a flag instead of killing the program
//   4. create the RawTerminal guard, then loop until the game is over, q is pressed or the flag
//      is set: read the keys, decide what they mean, tick, draw one whole frame, then sleep until
//      this tick's deadline (tick_ms)
//   5. after the guard is gone (the terminal is normal again): print the result line

#include <print>

int main(int argc, char* argv[]) {
    std::println("snake: not implemented yet ({} arguments given)", argc - 1);
    (void)argv;
    return 0;
}
