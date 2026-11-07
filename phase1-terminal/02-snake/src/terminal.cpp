// terminal.cpp — YOUR implementation of the guard and the key reader declared in terminal.hpp.
//
// Stubs: they compile and do nothing, so `snake` runs but the keyboard still waits for Enter and
// echoes what you type. Milestone 5 (book chapters 7 and 8) turns them into the real thing.
// While you work on this file, keep two commands in mind: `tput cnorm` shows a cursor that was left
// hidden, and `reset` puts every terminal setting back (type it blind if nothing echoes).

#include "terminal.hpp"

RawTerminal::RawTerminal() {
    // TODO(you): milestone 5 — save the settings, then change a copy of them
}

RawTerminal::~RawTerminal() {
    // TODO(you): milestone 5 — put back exactly what the constructor saved
}

std::string read_keys() {
    // TODO(you): milestone 5
    return "";
}
