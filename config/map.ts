// Public map settings.
export const MAP_CONFIG = {
  /** Past this many trucks, draw the late and at-risk ones and count the rest. */
  maxDrawn: 2000,
  /** Count badges drawn at once (biggest loads first); the hovered or picked truck always gets one. */
  maxBadges: 40,
  /** Initial view: the lower 48. Phones start further back so the whole country fits a tall screen. */
  camera: { target: [-93, 0, -36.5] as const, offset: [0, 36, 27] as const, phoneDistanceScale: 2.2, fov: 45 },
  /** Tilt limits from the ground plane, in degrees (polar angle from straight down). */
  tiltDeg: { min: 20, max: 70 },
  zoom: { min: 4, max: 150 },
  dpr: { phone: 1.25, desktop: 2 },
  /** Only loads this big get a badge on the road (the hovered or picked truck always does). */
  minBadgeOrders: 10,
  /** Trucks still loading park on a dock pad over the empty sea off the warehouse's coast, in rows
   * `columns` wide, noses toward land. Degrees from the warehouse. */
  yard: { offset: { lng: 3.4, lat: -3.4 }, columns: 7, spacing: { lng: 1.05, lat: -0.55 } },
} as const;

/** The company's display time zone (§3a). Times are stored and counted in UTC. */
export const COMPANY_TIME_ZONE = "America/New_York";
