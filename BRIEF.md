# Page brief: Argand diagram

For the agent building the `argand-diagram` branch. This file is not site content. Do not link it from a page, and do not print the specification codes on the page.

## Idea

A draggable Argand diagram. A-level students meet complex numbers as algebra. The marks on this part of the paper are for reading a picture: modulus, argument, what multiplication does, and loci.

AQA Further Mathematics 7367, compulsory pure, section B:

- B4 Argand diagrams
- B5 Cartesian form and modulus-argument form
- B6 multiplication and division in modulus-argument form
- B7 loci such as |z − a| = r and arg(z − a) = θ
- B10 the n distinct nth roots are the vertices of a regular n-gon

Multiplication here is the same idea as the matrix page. Multiplying by i is a rotation by π/2 with modulus unchanged, which that page already draws as the matrix with columns (0, 1) and (−1, 0). Say so in a sentence on this page. Do not rebuild the matrix visualiser.

## Where it goes

- Page: `app/topics/mathematics/argand-diagram/page.tsx`
- Card on `app/topics/mathematics/page.tsx`, next to Matrix Transformations.
- Title: Argand diagram
- Subtitle: Multiplication, loci, and roots on the complex plane.

## What the student does

One diagram, four tabs.

1. One number. Drag z. Show x + iy, the modulus, and the principal argument in radians, with −π < Arg z ≤ π. The negative real axis is the branch cut: the argument jumps when the point crosses it. Show the jump.

2. Multiplication. A second number w, with presets for i (rotate by π/2), 2 (enlarge, argument unchanged), and a general modulus and argument. Draw z, w, and zw. Arguments add, then fold back into (−π, π]. Moduli multiply. One division example is enough: arguments subtract, moduli divide. w = 0 is undefined.

3. Loci and roots.
   - |z − a| = r is the circle, centre a, radius r. The boundary is included.
   - |z − a| < r is the open disk. |z − a| > r is the outside. The boundary is not included in either inequality.
   - arg(z − a) = θ is a half-line starting at a, not a full line. The point z = a is not on it, because arg 0 is undefined.
   - The n nth roots of a fixed number, n from 2 to 8, as the vertices of a regular n-gon. Include the roots of unity, with one vertex at 1. The roots of re^{iθ} are r^{1/n} exp(i(θ + 2πk)/n) for k = 0, …, n − 1.

Dragging a, and sliders for r, θ, and n, should move the picture. A finished sketch is the thing this page replaces.

4. Proofs. Static tab: why |zw| = |z||w| and Arg(zw) = Arg z + Arg w (with principal-value folding), and the same for division when w ≠ 0. Use the trig expansion or modulus-argument form; keep it A-level length. Link multiplying by i to the matrix page in one sentence.

## Leave out

Solving quadratics, cubics, and quartics. Conjugate pairs as an algebra exercise. De Moivre and sums of series. Eigenvectors.

## How to build it

Client component, SVG, in the style of `app/topics/mathematics/calculus/derivatives/page.tsx` and `app/topics/mathematics/small-angle/page.tsx`. Use the existing classes: `page`, `card`, `topicHeader`, `cardGrid`, `backLink`, `cardTitle`, `cardSub`. No new dependency.

Page copy should sound like the other cards: short and plain. Angles in radians.

This branch is `main` plus this brief. Simpson's rule is not on it. Leave that alone.

`npm run dev` serves http://localhost:3001.

Check in the browser: drag a point across the negative real axis, multiply by i, and count the roots for n = 3 and n = 4.
