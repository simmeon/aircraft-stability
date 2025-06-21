/* 
ussa.js
Function to calculate the United States Standard Atmosphere 1976 for a given altitude.

Author: simmeon
Last Modified: 2025-06-20
*/

export function USStandardAtmosphere1976(altitudeMeters) {
  // Constants
  const g0 = 9.80665;       // m/s²
  const R = 8.3144598;      // J/(mol·K)
  const M = 0.0289644;      // kg/mol
  const Rs = R / M;         // Specific gas constant for air, J/(kg·K)
  const gamma = 1.4;        // Ratio of specific heats

  // Atmospheric layers: base geopotential altitudes (m), base temperature (K), lapse rate (K/m)
  const layers = [
    { h: 0,      T: 288.15, L: -0.0065 },
    { h: 11000,  T: 216.65, L: 0.0     },
    { h: 20000,  T: 216.65, L: 0.001   },
    { h: 32000,  T: 228.65, L: 0.0028  },
    { h: 47000,  T: 270.65, L: 0.0     },
    { h: 51000,  T: 270.65, L: -0.0028 },
    { h: 71000,  T: 214.65, L: -0.002  },
    { h: 84852,  T: 186.946, L: 0.0    } // Approximate upper bound
  ];

  // Find the atmospheric layer
  let layerIndex = 0;
  for (let i = 0; i < layers.length - 1; i++) {
    if (altitudeMeters < layers[i + 1].h) {
      layerIndex = i;
      break;
    }
  }

  const base = layers[layerIndex];
  const h0 = base.h;
  const T0 = base.T;
  const L = base.L;

  // Pressure at sea level (Pa)
  const P0 = 101325;

  // Calculate pressure at base of layer
  let P = P0;
  for (let i = 0; i < layerIndex; i++) {
    const { h: h_i, T: T_i, L: L_i } = layers[i];
    const h_next = layers[i + 1].h;
    if (L_i === 0) {
      P *= Math.exp(-g0 * (h_next - h_i) / (Rs * T_i));
    } else {
      const T_next = T_i + L_i * (h_next - h_i);
      P *= Math.pow(T_next / T_i, -g0 / (Rs * L_i));
    }
  }

  // Compute temperature and pressure at desired altitude
  const h = altitudeMeters;
  let T, rho;

  if (L === 0) {
    T = T0;
    P *= Math.exp(-g0 * (h - h0) / (Rs * T));
  } else {
    T = T0 + L * (h - h0);
    P *= Math.pow(T / T0, -g0 / (Rs * L));
  }

  // Density (kg/m³) from ideal gas law
  rho = P / (Rs * T);

  // Speed of sound (m/s)
  const a = Math.sqrt(gamma * Rs * T);

  return {
    temperature_K: T,
    pressure_Pa: P,
    density_kg_m3: rho,
    speed_of_sound_m_s: a
  };
}