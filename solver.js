/*
solver.js
Euler numerical integrator to solve a standard state space form of equations.
See: https://simmeon.github.io/blog/posts/rk45/rk45/ for way more info on numerical integrators.

Author: simmeon
Last Modified: 2025-06-20
*/

import { multiply, add, transpose } from "mathjs";

export function eulerStep(x, u, A, B, dt) {
    // Euler step looks like: x_{k+1} = x_{k} + dt * xdot_{k}
    // where xdot_{k} = A x_{k} + B u_{k}
    const Ax = transpose(multiply(A, x));
    const Bu = transpose(multiply(B, u));
    const xdot = add(Ax, Bu);
    return add(x, multiply(xdot, dt));
}