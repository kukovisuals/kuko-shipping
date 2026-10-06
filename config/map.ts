// Public map settings.
export const MAP_CONFIG = {
  /** Past this many open shipments, draw the late and at-risk ones and count the rest. */
  maxDrawn: 2000,
  /** Segments per route arc. */
  arcSegments: 32,
  /** Initial view: centred between the US and Europe. */
  camera: { target: [-45, 0, -30] as const, position: [-45, 95, 40] as const, fov: 45 },
  /** Tilt limits from the ground plane, in degrees (polar angle from straight down). */
  tiltDeg: { min: 20, max: 70 },
  zoom: { min: 12, max: 260 },
  dpr: { phone: 1.25, desktop: 2 },
} as const;
