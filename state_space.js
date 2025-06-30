/*
state_space.js
Aircraft longitudinal linear state space equations of motion.
Creates and returns the A and B matrices in equations of the form xdot = Ax + Bu.

Author: simmeon
Last Modified: 2025-06-20
*/

import {sin, cos, tan} from "mathjs";

import { USStandardAtmosphere1976 } from "./ussa";

// Specific aircraft properties - representative of a Cessna 182.
// All quantities are written in SI units.
// Reference: Jan Roskam - Airplane Flight Dynamics and Automatic Flight Controls (2001) Appendix B1.
export const aircraftProperties = {
    mass: 1202,
    Iyy: 1825,
    S: 16.16,
    c: 1.5
};

// Cruise steady state condition
export const steadyState1 = {
    altitude: 1524,
    TAS: 67,
    alpha: 0,
    CL_1: 0.307,
    CD_1: 0.032,
    theta: 0,
    de: 0,
};

// Climb steady state condition
export const steadyState2 = {
    altitude: 0,
    TAS: 40.7,
    alpha: 0.0942478,
    CL_1: 0.719,
    CD_1: 0.057,
    theta: 0.0942478,
    de: 0
};

// Approach steady state condition
export const steadyState3 = {
    altitude: 0,
    TAS: 32.6,
    alpha: 0.0698132,
    CL_1: 1.120,
    CD_1: 0.132,
    theta: 0.0698132,
    de: 0
};



export const coeffs = {
    CD_a: 0.121,
    CL_a: 4.41,
    CL_q: 3.9,
    Cm_a: -0.613,
    Cm_adot: -7.27,
    Cm_q: -12.4,
    CL_de: 0.43,
    Cm_de: -1.122
}

function dimensionalDerivatives(aircraftProperties, steadyState, coeffs) {
    // Aliases
    const m = aircraftProperties.mass;
    const Iyy = aircraftProperties.Iyy;
    const S = aircraftProperties.S;
    const c = aircraftProperties.c;
    
    const altitude = steadyState.altitude;
    const u1 = steadyState.TAS;
    const CL_1 =  steadyState.CL_1;
    const CD_1 =  steadyState.CD_1;

    const CD_a = coeffs.CD_a;
    const CL_a = coeffs.CL_a;
    const CL_q = coeffs.CL_q;
    const Cm_a = coeffs.Cm_a;
    const Cm_adot = coeffs.Cm_adot;
    const Cm_q = coeffs.Cm_q;
    const CL_de = coeffs.CL_de;
    const Cm_de = coeffs.Cm_de;

    // Derived
    const ussa = USStandardAtmosphere1976(altitude);
    const rho = ussa.density_kg_m3;
    const qbar = 0.5 * rho * u1 * u1;

    // Common factors
    const qS = qbar * S;
    const mu = m * u1;
    const qSc = qbar * S *c;
    const Iyyu = Iyy * u1;

    // Dimensional derivatives
    const Xu = - qS / mu * 2 * CD_1;
    const Xa = qS / m * (- CD_a + CL_1);

    const Zu = - qS / (mu * u1) * 2 * CL_1;
    const Za = qS / mu * (- CL_a - CD_1);
    const Zq = - qSc / (2 * mu * u1) * CL_q;
    const Zde = - qS / mu * CL_de;

    const Ma = qSc / Iyy * Cm_a;
    const Mq = qSc * c / (2 * Iyyu) * Cm_q;
    const Madot = qSc * c / (2 * Iyyu) * Cm_adot;
    const Mde = qSc / Iyy * Cm_de;

    return {
        Xu: Xu,
        Xa: Xa,
        Zu: Zu,
        Za: Za,
        Zq: Zq,
        Zde: Zde,
        Ma: Ma,
        Mq: Mq,
        Madot: Madot,
        Mde: Mde
    };   
}

function stateSpaceFromDimensional(steadyState, dimDerivs){
    // Aliases
    const Xu = dimDerivs.Xu;
    const Xa = dimDerivs.Xa;
    const Zu = dimDerivs.Zu;
    const Za = dimDerivs.Za;
    const Zq = dimDerivs.Zq;
    const Zde = dimDerivs.Zde;
    const Ma = dimDerivs.Ma;
    const Mq = dimDerivs.Mq;
    const Madot = dimDerivs.Madot;
    const Mde = dimDerivs.Mde;

    const u1 = steadyState.TAS;
    const aph1 = steadyState.alpha;
    const w1 = u1 * aph1;
    const tht1 = steadyState.theta;

    // Gravity
    const g = 9.81;

    // Matrices
    const A = [
        [Xu, Xa, - w1, - g * cos(tht1)], 
        [Zu, Za, 1 + Zq, - g * sin(tht1) / u1], 
        [Zu * Madot, Ma + Za * Madot, Mq + (1 + Zq) * Madot, - g * sin(tht1) / u1 * Madot], 
        [0, 0, 1, 0]
    ];

    const B = [0, Zde, Mde + Zde * Madot, 0];

    return {A: A, B: B};
}

export function stateSpaceMatrices(aircraftProperties, steadyState, coeffs) {
    const dimDerivs = dimensionalDerivatives(aircraftProperties, steadyState, coeffs);
    const ssMatrices = stateSpaceFromDimensional(steadyState, dimDerivs);

    return ssMatrices;
}