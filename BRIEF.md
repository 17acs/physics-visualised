# Page brief: Maclaurin series

For the agent building the `maclaurin-series` branch. This file is not site content. Do not link it from a page, and do not print the specification codes on the page.

## Idea

Plot a function and a partial sum of its Maclaurin series on the same axes. A slider adds terms. The student should see the gap close, and see where adding terms makes it worse.

The small-angle page is the first term of this. sin θ ≈ θ is the one-term polynomial for sin. Say that, and link to `/topics/mathematics/small-angle`.

AQA Further Mathematics 7367, section D:

- D5 Maclaurin series, including the general term
- D6 the series for e^x, ln(1+x), sin x, cos x, and (1+x)^n, and the values of x for which they are valid. Proof is not required.

## Where it goes

- Page: `app/topics/mathematics/maclaurin/page.tsx`
- Card on `app/topics/mathematics/page.tsx`.
- Title: Maclaurin series
- Subtitle: Partial sums against the function, and where they stop matching.
- On the small-angle page, add one sentence and a link here. Do not change that page's graph.

## What the student does

Pick a function. The slider sets how many terms are drawn. Plot f and the partial sum together. The gap between the curves is the point of the page.

Use these series. Do not add others.

- e^x = Σ x^k / k! from k = 0. Valid for every real x.
- sin x = x − x^3/3! + x^5/5! − … Valid for every real x.
- cos x = 1 − x^2/2! + x^4/4! − … Valid for every real x.
- ln(1+x) = x − x^2/2 + x^3/3 − … Valid for −1 < x ≤ 1. It diverges for x ≤ −1. At x = 1 the sum is ln 2.
- (1+x)^n = 1 + nx + n(n−1)/2! x^2 + … When n is a positive integer the series stops after n + 1 terms and is valid for every real x. Otherwise the range to show is |x| < 1. Do not mark the endpoints ±1 as always divergent: that depends on n, and the specification's range is |x| < 1.

For ln(1+x), and for a non-integer power, mark the valid interval on the axis. Inside it, more terms close the gap. Outside it, more terms make the gap worse. That contrast is the page.

For sin x, one term is the line y = x. That is the small-angle picture.

Show the general term as a line of text beside the chosen function. Do not derive it.

## Leave out

Limits and l'Hôpital. Taylor series about a point other than 0. Remainder formulae. A proof.

## How to build it

Client component, SVG, in the style of `app/topics/mathematics/calculus/derivatives/page.tsx`. Use the existing classes: `page`, `card`, `topicHeader`, `cardGrid`, `backLink`, `cardTitle`, `cardSub`. No new dependency.

Build each term from a running product. Do not compute a large factorial in floating point and then divide. Eight terms is enough on the slider for e^x, sin x, and cos x. Allow more for ln(1+x): it converges slowly near the ends of the interval. Keep the slider inside a range you have checked for overflow.

Page copy stays short and plain. This branch is `main` plus this brief. Simpson's rule is not on it. Leave that alone.

`npm run dev` serves http://localhost:3001.

Check in the browser: sin x with one term is y = x. More terms of e^x settle on both sides of the origin. ln(1+x) settles on (−1, 1] and pulls away for x > 1 and for x ≤ −1.
