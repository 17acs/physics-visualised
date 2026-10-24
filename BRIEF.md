# Page brief: Damped oscillations

For the agent building the `damped-oscillations` branch. This file is not site content. Do not link it from a page, and do not print the specification codes on the page.

## Idea

A mass on a spring, released from rest, next to the graph of its displacement. One slider changes the damping and crosses four regimes: none, light, critical, heavy. The label on the page comes from the sign of the discriminant of the auxiliary equation.

AQA Further Mathematics 7367, differential equations, section I:

- I6 the discriminant is positive, zero, or negative, and that decides the form of the solution
- I7 simple harmonic motion, ẍ = −ω²x
- I8 light, critical, and heavy damping, and when each happens
- I10 Hooke's law T = kx produces the simple harmonic equation
- I11 the damping force is proportional to velocity

## Where it goes

- Page: `app/topics/mathematics/damped-oscillations/page.tsx`
- Card on `app/topics/mathematics/page.tsx`. Title: Damped oscillations. Subtitle: Light, critical, and heavy damping from the auxiliary equation.
- The same card on `app/topics/mechanics/page.tsx`. This is the mathematics page that is also a mechanics page.

## The model

Horizontal spring, smooth surface. Mass m, stiffness k, damping coefficient c ≥ 0. Equilibrium is the unstretched spring. Displacement x is measured from there. There is no gravity term.

The spring pulls toward equilibrium: force −kx.
Damping opposes velocity: force −cv.

m ẍ = −c ẋ − kx, so

ẍ + a ẋ + b x = 0, with a = c/m and b = k/m.

Auxiliary equation: λ² + aλ + b = 0. Discriminant D = a² − 4b.

Keep m and k fixed and let the student vary c. Suggested numbers, so the motion is obvious in a few seconds and the critical value is easy to check: m = 1, k = 4. Then b = 4, undamped ω = 2, and critical damping is a = 4, so c = 4. Check the picture still fits the box before keeping these numbers.

Release from rest: x(0) = x_0, ẋ(0) = 0. Dragging the mass sets x_0. Releasing sets the velocity to 0. Do not give the mass a shove. With that start, critical and heavy damping stay on one side of equilibrium.

- c = 0. Undamped simple harmonic motion, which is I7. x = A cos ωt + B sin ωt, ω = √(k/m). Constant amplitude. This is the left end of the slider.
- D < 0 and c > 0. Light damping. x = e^{−(a/2)t} (A cos μt + B sin μt), with μ = √(b − (a/2)²). Oscillation inside a decaying envelope. Draw the envelope.
- D = 0. Critical damping. x = (A + Bt) e^{−(a/2)t}. For release from rest, x = x_0 (1 + (a/2)t) e^{−(a/2)t}. It does not oscillate. For this spring and mass, it is the non-oscillating return that dies away soonest.
- D > 0. Heavy damping. x = Ae^{λ₁t} + Be^{λ₂t}, both roots real and negative. No oscillation, and a slower return than the critical case.

Draw the curve from these closed forms, not from a numerical integrator. The closed form is what the specification asks the student to interpret. A stepped solution can drift off it, and the page would then be explaining the drift.

## What to draw

- The mass and the spring, moving.
- x against t, from the moment of release.
- The auxiliary equation, the value of D, and the name of the case, updated by the slider.
- A phase plane of x against v, with the direction field of ẋ = v, v̇ = −av − bx. That is the slope field for this equation. Do not draw a slope field of the displacement graph and call it one.

## Leave out

Integrating factors. A driving force and particular integrals. Coupled equations and predator-prey. Euler's method. A 3D scene. SVG is enough.

## How to build it

Client component, SVG, in the style of the mathematics pages. Use the existing classes: `page`, `card`, `topicHeader`, `cardGrid`, `backLink`, `cardTitle`, `cardSub`. No new dependency. Page copy stays short and plain.

This branch is `main` plus this brief. Simpson's rule is not on it. Leave that alone.

`npm run dev` serves http://localhost:3001.

Check in the browser: c = 0 keeps a constant amplitude. A small c oscillates inside a decaying envelope. At the critical value the mass does not cross equilibrium. A larger c returns more slowly and still does not cross. The name on the page matches the sign of D.
