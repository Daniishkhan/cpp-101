// snake_test.cpp — the acceptance tests for Week 3. Make every CHECK pass.
//
// DRAFT until the spec ritual on Fri 20 Nov 2026: if the ritual changes a rule (README.md,
// "Decisions for the spec ritual"), Claude rewrites the matching cases before Mon 23 Nov.
//
// Run:  cmake --build build && ./build/snake_tests
// Each TEST_CASE is one small claim about one function, in milestone order. Read the failing
// message: it prints the expression and the values it saw.

#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include <optional>
#include <random>
#include <string>
#include <vector>

#include "snake.hpp"

// ---------------------------------------------------------------- how failures print your types
// When a CHECK fails, doctest prints both sides. It can print numbers and strings, but not types
// you made yourself, so the lines below teach it: a Point prints as {3, 4}, a Body as
// [{3, 4} {2, 4}], a Direction as Right, an empty optional as nullopt. You do not need to
// understand how they work yet (they are templates, week 15); only read what they print.
static std::string text_of(Point p) {
    return "{" + std::to_string(p.x) + ", " + std::to_string(p.y) + "}";
}
static std::string text_of(Direction d) {
    switch (d) {
    case Direction::Up:
        return "Up";
    case Direction::Down:
        return "Down";
    case Direction::Left:
        return "Left";
    case Direction::Right:
        return "Right";
    }
    return "?";
}
static std::string text_of(Key k) {
    switch (k) {
    case Key::Up:
        return "Key::Up";
    case Key::Down:
        return "Key::Down";
    case Key::Left:
        return "Key::Left";
    case Key::Right:
        return "Key::Right";
    case Key::Pause:
        return "Key::Pause";
    case Key::Quit:
        return "Key::Quit";
    }
    return "?";
}
static std::string text_of(State s) {
    switch (s) {
    case State::Playing:
        return "Playing";
    case State::Lost:
        return "Lost";
    case State::Won:
        return "Won";
    }
    return "?";
}

namespace doctest {
template <> struct StringMaker<Point> {
    static String convert(const Point& p) {
        return text_of(p).c_str();
    }
};
template <> struct StringMaker<Body> {
    static String convert(const Body& body) {
        std::string s = "[";
        for (Point p : body) {
            s += (s.size() > 1 ? " " : "") + text_of(p);
        }
        return (s + "]").c_str();
    }
};
template <> struct StringMaker<Direction> {
    static String convert(Direction d) {
        return text_of(d).c_str();
    }
};
template <> struct StringMaker<Key> {
    static String convert(Key k) {
        return text_of(k).c_str();
    }
};
template <> struct StringMaker<State> {
    static String convert(State s) {
        return text_of(s).c_str();
    }
};
template <> struct StringMaker<std::optional<Key>> {
    static String convert(const std::optional<Key>& k) {
        return (k.has_value() ? text_of(*k) : std::string("nullopt")).c_str();
    }
};
template <> struct StringMaker<std::optional<Point>> {
    static String convert(const std::optional<Point>& p) {
        return (p.has_value() ? text_of(*p) : std::string("nullopt")).c_str();
    }
};
}  // namespace doctest

// A game for the tests to start from: the board, the snake (head first), the heading and the
// food. Everything else is as a new Game starts: score 0, Playing.
static Game game_with(int width, int height, const Body& body, Direction heading, Point food) {
    Game g;
    g.width = width;
    g.height = height;
    g.body = body;
    g.heading = heading;
    g.food = food;
    return g;
}

// An L-shaped snake on a 5x5 board: the whole top row and the whole left column (9 cells, head
// at the top right). The 16 free cells are exactly those with x >= 1 and y >= 1.
static Body l_shaped_snake() {
    return Body{{4, 0}, {3, 0}, {2, 0}, {1, 0}, {0, 0}, {0, 1}, {0, 2}, {0, 3}, {0, 4}};
}

// ---------------------------------------------------------------- milestone 1
TEST_CASE("next_head: one step in each direction (y grows downwards)") {
    CHECK(next_head({5, 5}, Direction::Up) == Point{5, 4});
    CHECK(next_head({5, 5}, Direction::Down) == Point{5, 6});
    CHECK(next_head({5, 5}, Direction::Left) == Point{4, 5});
    CHECK(next_head({5, 5}, Direction::Right) == Point{6, 5});
}

TEST_CASE("next_head: knows nothing about the board and can step outside it") {
    CHECK(next_head({0, 0}, Direction::Left) == Point{-1, 0});
    CHECK(next_head({0, 0}, Direction::Up) == Point{0, -1});
    CHECK(next_head({9, 4}, Direction::Right) == Point{10, 4});
    CHECK(next_head({9, 4}, Direction::Down) == Point{9, 5});
}

TEST_CASE("tick_ms: 150 ms then 10 ms faster every 5 points (never below 60 ms)") {
    CHECK(tick_ms(0) == 150);
    CHECK(tick_ms(4) == 150);
    CHECK(tick_ms(5) == 140);
    CHECK(tick_ms(9) == 140);
    CHECK(tick_ms(10) == 130);
    CHECK(tick_ms(44) == 70);
    CHECK(tick_ms(45) == 60);
    CHECK(tick_ms(50) == 60);
    CHECK(tick_ms(1000) == 60);
}

// ---------------------------------------------------------------- milestone 2
TEST_CASE("render: the wall and every kind of cell") {
    const Game g = game_with(4, 2, Body{{2, 1}, {1, 1}}, Direction::Right, {3, 0});
    CHECK(render(g) == "######\n"
                       "#   *#\n"
                       "# o@ #\n"
                       "######\n");

    // A bent snake: only the head is '@', every other cell of the body is 'o'.
    const Game bent =
        game_with(3, 2, Body{{1, 0}, {0, 0}, {0, 1}, {1, 1}}, Direction::Right, {2, 1});
    CHECK(render(bent) == "#####\n"
                          "#o@ #\n"
                          "#oo*#\n"
                          "#####\n");
}

TEST_CASE("render: height + 2 lines of width + 2 characters (snake drawn over food)") {
    const Game g = game_with(10, 5, Body{{5, 2}, {4, 2}, {3, 2}}, Direction::Right, {0, 0});
    const std::string text = render(g);
    CHECK(text.size() == 7u * 13u);  // 7 lines, each 12 characters and a '\n'
    CHECK(text.substr(0, 13) == "############\n");
    CHECK(text.substr(13, 13) == "#*         #\n");  // the food in the top-left cell
    CHECK(text.substr(39, 13) == "#   oo@    #\n");  // row 2: tail at x = 3, head at x = 5

    // After the last piece of food is eaten the food's cell is under the snake: draw the snake.
    const Game won = game_with(2, 1, Body{{1, 0}, {0, 0}}, Direction::Right, {1, 0});
    CHECK(render(won) == "####\n"
                         "#o@#\n"
                         "####\n");
}

// ---------------------------------------------------------------- milestone 3
TEST_CASE("on_body: every cell of the body and no other cell") {
    const Body body{{3, 3}, {2, 3}, {1, 3}, {1, 2}};
    CHECK(on_body(body, {3, 3}));  // the head
    CHECK(on_body(body, {2, 3}));
    CHECK(on_body(body, {1, 2}));  // the tail
    CHECK_FALSE(on_body(body, {4, 3}));
    CHECK_FALSE(on_body(body, {3, 1}));  // (1, 3) is on the body; (3, 1) is not
    CHECK_FALSE(on_body(Body{}, {0, 0}));
}

TEST_CASE("steer: turns when asked and keeps going without a key") {
    CHECK(steer(Direction::Right, Direction::Up) == Direction::Up);
    CHECK(steer(Direction::Right, Direction::Down) == Direction::Down);
    CHECK(steer(Direction::Up, Direction::Left) == Direction::Left);
    CHECK(steer(Direction::Down, Direction::Right) == Direction::Right);
    CHECK(steer(Direction::Left, Direction::Left) == Direction::Left);
    CHECK(steer(Direction::Right, std::nullopt) == Direction::Right);
    CHECK(steer(Direction::Down, std::nullopt) == Direction::Down);
}

TEST_CASE("steer: a request to reverse is ignored") {
    CHECK(steer(Direction::Right, Direction::Left) == Direction::Right);
    CHECK(steer(Direction::Left, Direction::Right) == Direction::Left);
    CHECK(steer(Direction::Up, Direction::Down) == Direction::Up);
    CHECK(steer(Direction::Down, Direction::Up) == Direction::Down);
}

TEST_CASE("parse_key: letters in either case") {
    CHECK(parse_key("w") == Key::Up);
    CHECK(parse_key("W") == Key::Up);
    CHECK(parse_key("s") == Key::Down);
    CHECK(parse_key("S") == Key::Down);
    CHECK(parse_key("a") == Key::Left);
    CHECK(parse_key("A") == Key::Left);
    CHECK(parse_key("d") == Key::Right);
    CHECK(parse_key("D") == Key::Right);
    CHECK(parse_key("p") == Key::Pause);
    CHECK(parse_key("P") == Key::Pause);
    CHECK(parse_key("q") == Key::Quit);
    CHECK(parse_key("Q") == Key::Quit);
}

TEST_CASE("parse_key: arrow keys are three bytes and Ctrl-C is one") {
    CHECK(parse_key("\x1b[A") == Key::Up);
    CHECK(parse_key("\x1b[B") == Key::Down);
    CHECK(parse_key("\x1b[C") == Key::Right);
    CHECK(parse_key("\x1b[D") == Key::Left);
    CHECK(parse_key("\x03") == Key::Quit);
}

TEST_CASE("parse_key: no key or a key the game does not use") {
    CHECK_FALSE(parse_key("").has_value());  // nothing was pressed this tick
    CHECK_FALSE(parse_key("x").has_value());
    CHECK_FALSE(parse_key(" ").has_value());
    CHECK_FALSE(parse_key("\x1b").has_value());    // Escape on its own
    CHECK_FALSE(parse_key("\x1b[").has_value());   // an arrow cut short
    CHECK_FALSE(parse_key("\x1b[Z").has_value());  // Shift-Tab: an escape sequence, not an arrow
    CHECK_FALSE(parse_key("[A").has_value());      // an arrow without its Escape byte
}

TEST_CASE("parse_key: only the first key counts") {
    CHECK(parse_key("wd") == Key::Up);
    CHECK(parse_key("\x1b[Bq") == Key::Down);
    CHECK(parse_key("q\x1b[A") == Key::Quit);
    CHECK_FALSE(parse_key("xw").has_value());  // the first key means nothing; the w is not read
}

// ---------------------------------------------------------------- milestone 4
TEST_CASE("place_food: always on the board and never on the snake") {
    std::mt19937 rng(7);
    const Body body = l_shaped_snake();
    for (int i = 0; i < 200; ++i) {
        const std::optional<Point> food = place_food(body, 5, 5, rng);
        REQUIRE(food.has_value());
        CHECK(food->x >= 1);  // x == 0 is the snake's left column
        CHECK(food->x <= 4);
        CHECK(food->y >= 1);  // y == 0 is the snake's top row
        CHECK(food->y <= 4);
    }
}

TEST_CASE("place_food: every free cell about equally often") {
    // 1,600 draws over the 16 free cells: about 100 each. A fair choice stays well inside 50 to
    // 150; a choice that favours some cells (say, "the next free cell after a random one") lands
    // several hundred times on the cell just after the snake.
    std::mt19937 rng(2026);
    const Body body = l_shaped_snake();
    std::vector<std::vector<int>> counts(5, std::vector<int>(5, 0));  // counts[y][x]
    for (int i = 0; i < 1600; ++i) {
        const std::optional<Point> food = place_food(body, 5, 5, rng);
        REQUIRE(food.has_value());
        REQUIRE(food->x >= 1);
        REQUIRE(food->x <= 4);
        REQUIRE(food->y >= 1);
        REQUIRE(food->y <= 4);
        counts[food->y][food->x] += 1;
    }
    for (int y = 1; y <= 4; ++y) {
        for (int x = 1; x <= 4; ++x) {
            CAPTURE(x);
            CAPTURE(y);
            CHECK(counts[y][x] > 50);
            CHECK(counts[y][x] < 150);
        }
    }
}

TEST_CASE("place_food: the last free cell and then no cell at all") {
    std::mt19937 rng(1);
    // A 3x2 board with five of its six cells taken: only (2, 1) is free.
    const Body five{{1, 1}, {0, 1}, {0, 0}, {1, 0}, {2, 0}};
    for (int i = 0; i < 20; ++i) {
        const std::optional<Point> food = place_food(five, 3, 2, rng);
        REQUIRE(food.has_value());
        CHECK(*food == Point{2, 1});
    }
    const Body six{{2, 1}, {1, 1}, {0, 1}, {0, 0}, {1, 0}, {2, 0}};
    CHECK_FALSE(place_food(six, 3, 2, rng).has_value());
}

TEST_CASE("place_food: the same seed gives the same food and the engine moves on") {
    const Body body{{5, 5}, {4, 5}, {3, 5}};
    std::mt19937 a(99);
    std::mt19937 b(99);
    std::optional<Point> first;
    bool all_the_same = true;
    for (int i = 0; i < 10; ++i) {
        const std::optional<Point> from_a = place_food(body, 20, 10, a);
        const std::optional<Point> from_b = place_food(body, 20, 10, b);
        REQUIRE(from_a.has_value());
        CHECK(from_a == from_b);  // two engines with one seed: one sequence
        if (i == 0) {
            first = from_a;
        } else if (from_a != first) {
            all_the_same = false;
        }
    }
    CHECK_FALSE(all_the_same);  // ten calls on one engine: not the same cell ten times
}

TEST_CASE("new_game: three cells in the middle heading right with food on a free cell") {
    std::mt19937 rng(5);
    const Game g = new_game(10, 6, rng);
    CHECK(g.width == 10);
    CHECK(g.height == 6);
    CHECK(g.body == Body{{5, 3}, {4, 3}, {3, 3}});
    CHECK(g.heading == Direction::Right);
    CHECK(g.score == 0);
    CHECK(g.state == State::Playing);
    CHECK(g.food.x >= 0);
    CHECK(g.food.x < 10);
    CHECK(g.food.y >= 0);
    CHECK(g.food.y < 6);
    const bool food_on_snake = g.food.y == 3 && g.food.x >= 3 && g.food.x <= 5;
    CHECK_FALSE(food_on_snake);
}

TEST_CASE("new_game: odd sizes round down and the food is never on the snake") {
    std::mt19937 rng(11);
    CHECK(new_game(11, 7, rng).body == Body{{5, 3}, {4, 3}, {3, 3}});
    for (unsigned int seed = 0; seed < 50; ++seed) {
        std::mt19937 r(seed);
        const Game g = new_game(8, 5, r);
        CHECK(g.body == Body{{4, 2}, {3, 2}, {2, 2}});
        const bool food_on_snake = g.food.y == 2 && g.food.x >= 2 && g.food.x <= 4;
        CHECK_FALSE(food_on_snake);
    }
}

TEST_CASE("tick: one cell forward with the same length and the food untouched") {
    std::mt19937 rng(1);
    Game g = game_with(10, 6, Body{{5, 3}, {4, 3}, {3, 3}}, Direction::Right, {0, 0});
    tick(g, std::nullopt, rng);
    CHECK(g.body == Body{{6, 3}, {5, 3}, {4, 3}});
    CHECK(g.state == State::Playing);
    CHECK(g.score == 0);
    CHECK(g.food == Point{0, 0});
    tick(g, std::nullopt, rng);
    CHECK(g.body == Body{{7, 3}, {6, 3}, {5, 3}});
}

TEST_CASE("tick: turns when asked and never reverses") {
    std::mt19937 rng(1);
    Game g = game_with(10, 6, Body{{5, 3}, {4, 3}, {3, 3}}, Direction::Right, {0, 0});
    tick(g, Direction::Up, rng);
    CHECK(g.body == Body{{5, 2}, {5, 3}, {4, 3}});
    CHECK(g.heading == Direction::Up);
    tick(g, Direction::Down, rng);  // a reversal: ignored, so it keeps going up
    CHECK(g.body == Body{{5, 1}, {5, 2}, {5, 3}});
    CHECK(g.heading == Direction::Up);
}

TEST_CASE("tick: eating scores a point and the snake grows by one") {
    std::mt19937 rng(3);
    Game g = game_with(10, 6, Body{{5, 3}, {4, 3}, {3, 3}}, Direction::Right, {6, 3});
    tick(g, std::nullopt, rng);
    CHECK(g.body == Body{{6, 3}, {5, 3}, {4, 3}, {3, 3}});  // the tail stayed: one longer
    CHECK(g.score == 1);
    CHECK(g.state == State::Playing);
    CHECK(g.food.x >= 0);
    CHECK(g.food.x < 10);
    CHECK(g.food.y >= 0);
    CHECK(g.food.y < 6);
    const bool food_on_snake = g.food.y == 3 && g.food.x >= 3 && g.food.x <= 6;
    CHECK_FALSE(food_on_snake);

    g.food = {0, 0};  // out of the way, so the next tick cannot eat again
    tick(g, std::nullopt, rng);
    CHECK(g.body == Body{{7, 3}, {6, 3}, {5, 3}, {4, 3}});  // grown once, not twice
    CHECK(g.score == 1);
}

TEST_CASE("tick: the wall ends the game and the snake stays where it was") {
    std::mt19937 rng(1);
    Game right = game_with(10, 6, Body{{9, 3}, {8, 3}, {7, 3}}, Direction::Right, {0, 0});
    tick(right, std::nullopt, rng);
    CHECK(right.state == State::Lost);
    CHECK(right.body == Body{{9, 3}, {8, 3}, {7, 3}});

    Game up = game_with(10, 6, Body{{4, 0}, {4, 1}, {4, 2}}, Direction::Up, {0, 5});
    tick(up, std::nullopt, rng);
    CHECK(up.state == State::Lost);

    Game left = game_with(10, 6, Body{{0, 2}, {1, 2}, {2, 2}}, Direction::Left, {9, 5});
    tick(left, std::nullopt, rng);
    CHECK(left.state == State::Lost);

    Game down = game_with(10, 6, Body{{4, 5}, {4, 4}, {4, 3}}, Direction::Down, {0, 0});
    tick(down, std::nullopt, rng);
    CHECK(down.state == State::Lost);
}

TEST_CASE("tick: biting the body ends the game") {
    // Five cells curled up, head at (1, 1) moving left:  row 1:  . @ o
    //                                                      row 2:  o o o   (tail at the left)
    // Turning down puts the head on (1, 2), which is body, and not the tail.
    std::mt19937 rng(1);
    const Body curled{{1, 1}, {2, 1}, {2, 2}, {1, 2}, {0, 2}};
    Game g = game_with(6, 5, curled, Direction::Left, {5, 0});
    tick(g, Direction::Down, rng);
    CHECK(g.state == State::Lost);
    CHECK(g.body == curled);
}

TEST_CASE("tick: the head may move into the cell the tail is leaving") {
    // Four cells in a 2x2 square chase their own tail, round and round.
    std::mt19937 rng(1);
    const Body square{{0, 0}, {1, 0}, {1, 1}, {0, 1}};
    Game g = game_with(4, 4, square, Direction::Left, {3, 3});
    tick(g, Direction::Down, rng);  // into (0, 1), the tail's cell
    CHECK(g.state == State::Playing);
    CHECK(g.body == Body{{0, 1}, {0, 0}, {1, 0}, {1, 1}});
    tick(g, Direction::Right, rng);
    CHECK(g.body == Body{{1, 1}, {0, 1}, {0, 0}, {1, 0}});
    tick(g, Direction::Up, rng);
    CHECK(g.body == Body{{1, 0}, {1, 1}, {0, 1}, {0, 0}});
    tick(g, Direction::Left, rng);
    CHECK(g.body == square);  // all the way round
    CHECK(g.state == State::Playing);
}

TEST_CASE("tick: eating the last free cell wins the game") {
    // A 2x2 board: the snake has three of the cells, the food is on the fourth.
    std::mt19937 rng(1);
    Game g = game_with(2, 2, Body{{1, 0}, {0, 0}, {0, 1}}, Direction::Right, {1, 1});
    tick(g, Direction::Down, rng);
    CHECK(g.state == State::Won);
    CHECK(g.score == 1);
    CHECK(g.body == Body{{1, 1}, {1, 0}, {0, 0}, {0, 1}});
}

TEST_CASE("tick: nothing changes once the game is over") {
    std::mt19937 rng(1);
    Game g = game_with(10, 6, Body{{5, 3}, {4, 3}, {3, 3}}, Direction::Right, {6, 3});
    g.state = State::Lost;
    tick(g, Direction::Up, rng);
    CHECK(g.body == Body{{5, 3}, {4, 3}, {3, 3}});
    CHECK(g.heading == Direction::Right);
    CHECK(g.score == 0);
    CHECK(g.state == State::Lost);
}
