// snake.cpp — YOUR implementation of the functions declared in snake.hpp.
//
// Every function below is a stub: it compiles, but returns the wrong answer (or does nothing),
// so the tests start RED. Your job this week is to turn them GREEN, one milestone at a time, in
// the order they appear. The Week 3 book (docs/book/week3) teaches every piece on a different
// problem; chapter 9 has the milestones and the hint ladders. Do not look for a solution.

#include "snake.hpp"

Point next_head(Point head, Direction heading) {
    // TODO(you): milestone 1 — a switch with one case per direction
    (void)heading;
    return head;
}

int tick_ms(int score) {
    // TODO(you): milestone 1
    (void)score;
    return 0;
}

std::string render(const Game& game) {
    // TODO(you): milestone 2
    (void)game;
    return "";
}

bool on_body(const Body& body, Point p) {
    // TODO(you): milestone 3
    (void)body;
    (void)p;
    return false;
}

Direction steer(Direction heading, std::optional<Direction> wanted) {
    // TODO(you): milestone 3
    (void)wanted;
    return heading;
}

std::optional<Key> parse_key(const std::string& bytes) {
    // TODO(you): milestone 3 — look at the first byte first
    (void)bytes;
    return std::nullopt;
}

std::optional<Point> place_food(const Body& body, int width, int height, std::mt19937& rng) {
    // TODO(you): milestone 4
    (void)body;
    (void)width;
    (void)height;
    (void)rng;
    return std::nullopt;
}

Game new_game(int width, int height, std::mt19937& rng) {
    // TODO(you): milestone 4
    (void)width;
    (void)height;
    (void)rng;
    return Game{};
}

void tick(Game& game, std::optional<Direction> wanted, std::mt19937& rng) {
    // TODO(you): milestone 4 — follow the five numbered steps in snake.hpp, in order
    (void)game;
    (void)wanted;
    (void)rng;
}
