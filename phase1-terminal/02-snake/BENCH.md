# BENCH — 02-snake

Fill this in on Sat 28 Nov 2026 (milestone M7, the Saturday measurement slot), after all 26 tests
are green. Build in Release (`cmake -S . -B build-release -G Ninja -DCMAKE_BUILD_TYPE=Release`),
on mains power, nothing else heavy running. Week 1 book chapter 13 has the rules: warm up, take the
fastest of several runs for a comparison, and always say the build type, the machine and the date.

## Experiment (write the Prediction BEFORE the first run)

**Question.** How does the cost of one `tick` grow with the length of the snake? Every tick checks
the new head against the body, the way every decode step of a language model looks at every token
already in its context.

**Prediction** (a number and a direction, written before running `snake_bench`; date it):

- From length 1,000 to length 100,000, ns per tick grows by a factor of about ______, because ______.
- Below about ______ cells the line is flat, because ______.
- The render of a 30 × 15 board takes about ______ µs, which is ______% of a 60 ms tick.

**Measurement** (Release unless the row says otherwise):

| Date | Machine | Build | Snake length | ns / tick | ns / cell of body | Notes |
|------|---------|-------|--------------|-----------|-------------------|-------|
|      |         |       | 10           |           |                   |       |
|      |         |       | 100          |           |                   |       |
|      |         |       | 1,000        |           |                   |       |
|      |         |       | 10,000       |           |                   |       |
|      |         |       | 100,000      |           |                   |       |
|      |         | Debug | 10,000       |           |                   | sanitizers on, for comparison |

| Date | Machine | Build | Board | Snake length | µs / frame | Notes |
|------|---------|-------|-------|--------------|------------|-------|
|      |         |       | 30 × 15 | 20         |            |       |
|      |         |       | 200 × 100 | 2,000    |            |       |

**Explanation** (two sentences; if the prediction was wrong, which assumption was):

> ...

## The maths strand: 10,000 food draws

Before running `./build-release/snake_bench draws`, write on paper (and then in the week log):
the count you expect in each of the 100 cells, and how far from it a typical cell will land. Then
run it and copy the three summary lines here.

| Date | Expected per cell (your prediction) | Typical distance (your prediction) | Measured lowest / highest | Measured typical distance |
|------|------|------|------|------|
|      |      |      |      |      |

## Late ticks

From the last line of a real game (`... N ticks, K late ...`): how many ticks overran their
budget, at which board size and speed. A Debug build with the sanitizers on is the place to look
for a non-zero number.

| Date | Build | Board | Ticks | Late | Notes |
|------|-------|-------|-------|------|-------|
|      |       |       |       |      |       |
