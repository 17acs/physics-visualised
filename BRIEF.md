# Page brief: Polar curves

For the agent building the `polar-curves` branch. This file is not site content. Do not link it from a page, and do not print the specification codes on the page.

## Idea

Draw polar curves by moving θ and leaving the ink behind, so a sketch is a trace rather than a finished picture. Then shade one area and show the limits of the integral.

AQA Further Mathematics 7367, section G:

- G1 polar coordinates, and conversion to Cartesian
- G2 sketches of r as a function of θ, including trigonometric r
- G3 the area enclosed by a polar curve

## Where it goes

- Page: `app/topics/mathematics/polar-curves/page.tsx`
- Card on `app/topics/mathematics/page.tsx`.
- Title: Polar curves
- Subtitle: Trace r(θ), and see the area a sector sweeps.

## What the student does

Presets, with a slider for the parameter in the formula:

- r = a. A circle, centre the origin.
- r = a(1 + cos θ). A cardioid.
- r = a + b cos θ, with b > a > 0. An inner loop. The loop is there because a < b. At θ = π, r = a − b < 0.
- r = sin(nθ), n a positive integer. Odd n gives n petals. Even n gives 2n petals.

Animate θ and keep the ray at the current θ, with the point on it. Read that point out in Cartesian form: x = r cos θ, y = r sin θ.

Negative r is plotted in the opposite direction, at angle θ + π. Do not take the absolute value. The inner loop and the extra petals of an even rose depend on this.

### Area

Shade one region and show the limits. The element of area is (1/2) ∫ r² dθ.

- Cardioid r = a(1 + cos θ), from 0 to 2π, is traced once. The area is (3/2) π a².
- For a rose, shade one petal, between two neighbouring angles where r = 0. Do not integrate from 0 to 2π and call the result the area. For r = sin(nθ) that interval traces the curve more than once, so the integral is a multiple of the area.

## Leave out

A text box for an arbitrary formula. Ship these presets only.

## How to build it

Client component, SVG, in the style of `app/topics/mathematics/calculus/derivatives/page.tsx`. Use the existing classes: `page`, `card`, `topicHeader`, `cardGrid`, `backLink`, `cardTitle`, `cardSub`. No new dependency.

θ in radians in the calculation. A degree label is fine beside it if it helps a sketch. Page copy stays short and plain.

This branch is `main` plus this brief. Simpson's rule is not on it. Leave that alone.

`npm run dev` serves http://localhost:3001.

Check in the browser: the cardioid closes after one turn. The limaçon has a loop only when a < b. A 3-petal rose and a 4-petal rose match the odd and even rule. One petal is shaded between zeros of r. Dragging θ through a negative r sends the point the other way.
