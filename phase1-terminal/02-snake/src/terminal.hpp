#pragma once
// terminal.hpp — the keyboard side of Snake: raw mode and reading keys without waiting.
//
// DRAFT until the spec ritual on Fri 20 Nov 2026 (README.md). You write the definitions in
// terminal.cpp. Nothing here can be unit-tested (the tests run without a keyboard), so the proof
// is by hand: play, quit with q, die, press Ctrl-C, and check the terminal works every time.
// Book chapters 7 (scope, lifetime and RAII) and 8 (raw keys and the game loop) teach the pieces.

#include <string>

#include <termios.h>  // termios, tcgetattr, tcsetattr: the terminal's settings (POSIX, not std::)

// A guard. While one of these exists, the terminal is in the mode the game needs; when it is
// destroyed, however the scope that holds it ends, the terminal is put back exactly as it was.
struct RawTerminal {
    // Saves the terminal's current settings in `saved`, then switches the keyboard to raw mode:
    // no echo, no line buffering (each key arrives at once, without Enter), and a read that
    // returns at once with nothing when no key is waiting. Ctrl-C keeps sending its signal.
    // Also hides the cursor.
    RawTerminal();

    // Puts back the settings saved by the constructor and shows the cursor again.
    ~RawTerminal();

    termios saved{};  // the settings to restore
};

// Every byte that is waiting on standard input right now, in the order it arrived, without
// waiting for more: "" when no key was pressed. Needs a RawTerminal to exist, otherwise the
// terminal holds keys back until Enter.
std::string read_keys();
