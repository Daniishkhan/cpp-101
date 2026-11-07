#pragma once
// snake.hpp — the contract for Week 3: Snake in the terminal.
//
// DRAFT until the spec ritual on Fri 20 Nov 2026 (see README.md, "Decisions for the spec ritual").
// After the ritual this header is frozen: the tests in tests/snake_test.cpp call these exact names
// and signatures, so keep them as they are. Everything else about the implementation is yours.
//
// This header DECLARES the game. You write the DEFINITIONS in snake.cpp.
// The terminal side (raw keyboard mode, reading keys) is declared in terminal.hpp.
//
// The board (the one picture to keep in your head this week):
//   The board has `width` columns and `height` rows. Column x runs left to right from 0, row y runs
//   top to bottom from 0, so (0, 0) is the top-left cell and y grows DOWNWARDS, like the rows of
//   text on your screen. The wall is outside the board: x == -1, x == width, y == -1 and
//   y == height are all wall. The snake is a list of cells, head first.

#include <deque>
#include <optional>
#include <random>
#include <string>

// Which way the head moves on the next tick.
enum class Direction { Up, Down, Left, Right };

// What one key press means to the game (see parse_key).
enum class Key { Up, Down, Left, Right, Pause, Quit };

// Where a game stands. A game starts Playing and ends Lost or Won; it never goes back.
enum class State { Playing, Lost, Won };

// One cell of the board: column x, row y.
struct Point {
    int x = 0;
    int y = 0;
    bool operator==(const Point&) const = default;  // equal when both x and y are equal
};

// The snake, head first: body.front() is the head, body.back() is the tail.
using Body = std::deque<Point>;

// Everything the game remembers from one tick to the next.
struct Game {
    int width = 0;                         // columns of the board (the wall is not counted)
    int height = 0;                        // rows of the board (the wall is not counted)
    Body body;                             // head first
    Direction heading = Direction::Right;  // the way the head moved on the last tick
    Point food;                            // where the food is
    int score = 0;                         // how many pieces of food have been eaten
    State state = State::Playing;
};

// ---------------------------------------------------------------- milestone 1

// The cell next to `head` in direction `heading`. It knows nothing about the board, so the
// answer may be outside it (that is how the game finds out the snake hit the wall).
//   next_head({5, 5}, Direction::Up)   == Point{5, 4}      (up is y - 1)
//   next_head({5, 5}, Direction::Right) == Point{6, 5}
//   next_head({0, 0}, Direction::Left)  == Point{-1, 0}
Point next_head(Point head, Direction heading);

// How long one tick lasts, in milliseconds, at this score: 150 ms at the start, 10 ms faster
// for every 5 points, and never faster than 60 ms.
//   tick_ms(0) == 150,  tick_ms(4) == 150,  tick_ms(5) == 140,  tick_ms(12) == 130,
//   tick_ms(45) == 60,  tick_ms(1000) == 60
int tick_ms(int score);

// ---------------------------------------------------------------- milestone 2

// The board as text, ready to print: height + 2 lines of width + 2 characters, each line
// followed by '\n'. The first and last lines are all '#' (the wall); every other line starts
// and ends with '#'. Inside: '@' for the head, 'o' for the rest of the body, '*' for the food,
// and ' ' (a space) for an empty cell. If a part of the snake is on the food's cell, the snake
// is drawn. A 4x2 board, snake (2,1) (1,1), food (3,0):
//   "######\n"
//   "#   *#\n"
//   "# o@ #\n"
//   "######\n"
std::string render(const Game& game);

// ---------------------------------------------------------------- milestone 3

// Is the cell `p` one of the cells of `body`?
bool on_body(const Body& body, Point p);

// The heading for the next tick. `wanted` is the direction the player asked for this tick, or
// std::nullopt if no direction key was pressed. A request to reverse (Left while heading
// Right, Up while heading Down, ...) is ignored, because the head would run into the neck.
//   steer(Direction::Right, std::nullopt)    == Direction::Right
//   steer(Direction::Right, Direction::Up)   == Direction::Up
//   steer(Direction::Right, Direction::Left) == Direction::Right
Direction steer(Direction heading, std::optional<Direction> wanted);

// What the bytes read from the keyboard in one tick mean, or std::nullopt if they mean nothing
// to the game (including "" when no key was pressed). Only the FIRST key in `bytes` counts.
//   "w" "W" or an up arrow    "\x1b[A"   -> Key::Up
//   "s" "S" or a down arrow   "\x1b[B"   -> Key::Down
//   "a" "A" or a left arrow   "\x1b[D"   -> Key::Left
//   "d" "D" or a right arrow  "\x1b[C"   -> Key::Right
//   "p" "P"                              -> Key::Pause
//   "q" "Q" or Ctrl-C, the byte "\x03"   -> Key::Quit
//   anything else, a lone "\x1b" included -> std::nullopt
std::optional<Key> parse_key(const std::string& bytes);

// ---------------------------------------------------------------- milestone 4

// A random free cell for the food: inside the width x height board and not on `body`. Every
// free cell must be equally likely, and the same engine state must give the same cell (so a
// seed replays a game). Returns std::nullopt when there is no free cell left.
// `rng` is passed by reference on purpose: each call moves the engine on, so the next call
// gives a new cell.
std::optional<Point> place_food(const Body& body, int width, int height, std::mt19937& rng);

// A new game on a width x height board (at least 4 x 1): a snake of 3 cells, head at
// (width / 2, height / 2) and the two other cells to its left, heading Right, score 0,
// Playing, and the food on a free cell from place_food.
//   new_game(10, 6, rng).body == Body{{5, 3}, {4, 3}, {3, 3}}
Game new_game(int width, int height, std::mt19937& rng);

// One tick of the game. Does nothing unless the game is Playing. Otherwise:
//   1. The heading becomes steer(heading, wanted).
//   2. The new head is next_head(old head, heading).
//   3. If the new head is outside the board, or on the body, the game is Lost and the body is
//      left exactly as it was. Exception: the tail's cell is free to move into when the snake is
//      not eating, because the tail leaves that cell in the same tick.
//   4. Otherwise the snake moves: the new head is added at the front and, unless it landed on the
//      food, the tail is removed from the back (so the length stays the same).
//   5. If it landed on the food: the score goes up by 1, the snake is now one cell longer, and
//      the food moves to place_food(...). If there is no free cell left, the game is Won.
void tick(Game& game, std::optional<Direction> wanted, std::mt19937& rng);
