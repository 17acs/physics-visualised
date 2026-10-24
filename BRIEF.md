# Page brief: Newton-Raphson

For the agent building the `newton-raphson` branch. This file is not site content. Do not link it from a page, and do not print the specification codes on the page.

## Idea

Show the two pictures A-level students are told to draw and rarely see move: the Newton tangent step, and the cobweb or staircase for a rearrangement.

AQA A-level Mathematics 7357, section I:

- I1 A change of sign locates a root, and that method can fail.
- I2 Cobweb and staircase diagrams for x_{n+1} = g(x_n), and the Newton-Raphson method. The specification names those diagrams, and it says to understand how the methods fail.

The derivatives page already turns a secant into a tangent. This page uses the tangent to hunt a root.

## Where it goes

- Page: `app/topics/mathematics/calculus/newton-raphson/page.tsx`
- On `app/topics/mathematics/calculus/page.tsx`, replace the card titled "Haven't decided yet". Leave the Integrals card as it is.
- Title: Newton-Raphson
- Subtitle: Follow the tangent, and see when iteration fails.

## What the student does

Two modes, one diagram each.

### Newton-Raphson

Plot f. The student steps from a labelled start x_0. Each step draws the tangent and the next estimate, where that tangent crosses the x-axis.

x_{n+1} = x_n − f(x_n) / f'(x_n)

Presets, already checked:

- Converges. f(x) = x^2 − 2, start at 1. The estimates go to √2.
- Stops at once. The same curve, start at 0. f'(0) = 0, so there is no next estimate. Say that on the diagram.
- Cycles. f(x) = x^3 − 2x + 2, and f'(x) = 3x^2 − 2. Start at 0: f(0) = 2, f'(0) = −2, so x_1 = 1. Then f(1) = 1, f'(1) = 1, so x_2 = 0. The estimates swap between 0 and 1 forever.

### Cobweb and staircase

Plot y = x and y = g(x). Step the iteration and draw the horizontal and vertical segments.

Name the picture from the path. A staircase stays on one side of the root as it closes in. A cobweb alternates sides.

Presets, already checked:

- Staircase. g(x) = (x + 2) / 2. The fixed point is 2, and g'(2) = 1/2, which is between 0 and 1. From 0 the iterates are 1, 1.5, 1.75, … From 6 they are 4, 3, 2.5, …
- Cobweb. g(x) = cos x. The fixed point is the solution of x = cos x (about 0.739), and the derivative there is −sin of that value, about −0.67, so between −1 and 0. Starting at 0, the steps alternate and close in.
- Diverges. g(x) = 2x. The fixed point is 0 and g'(0) = 2, so |g'(L)| > 1. From 0.3 the iterates are 0.6, 1.2, 2.4, …

## Leave out

The trapezium rule, Simpson's rule, and the mid-ordinate rule. Those have their own branches. This branch was cut from `main`, which does not contain them. Do not bring them back.

Do not build a general equation solver.

## How to build it

Client component, SVG, in the style of `app/topics/mathematics/calculus/derivatives/page.tsx`. Use the existing classes: `page`, `card`, `topicHeader`, `cardGrid`, `backLink`, `cardTitle`, `cardSub`. No new dependency.

Show the recurrence the diagram is using, the way the derivatives page shows the chord. Page copy stays short and plain.

`npm run dev` serves http://localhost:3001.

Check in the browser, and read the points off the diagram: the converging Newton sequence, the zero-derivative stop, the 0-and-1 cycle, one staircase, one cobweb, and one divergent iteration.
