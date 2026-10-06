// Palette for the 3D scene; must match ui/tokens.css.
export const THEME = {
  background: "#07081a", // page + night sky (with fog)
  surface: "#12143a", // panels, cards, dark architecture (plaza, beacon, UFO hull)
  ground: "#0d0f2b", // floating city platform top
  floor: "#110b2c", // floor under the cities, where the circuit runs (dark purple)
  body: "#1a1d4a", // building voxels, platform sides
  line: "#2c3070", // borders, trims, sign posts
  road: "#14173d", // road surface (two-way UFO lanes)
  accent: "#ff2e97", // primary buttons, links, your UFO (neon pink)
  flow: "#22d3ee", // lane lines, beacons, beam, holograms (neon cyan)
  neon: "#c43cff", // neon borders along city edges and roads (purple)
  open: "#39ff88", // status: open (green)
  openBuilding: "#158240", // status: open on the 3D buildings (softer green, glows less)
  pending: "#b15cff", // status: pending (violet)
  sold: "#4f7cff", // status: sold / live (electric blue)
  fun: "#ffb020", // Hub only: rides, lights (amber)
  party: "#ff4fd8", // Hub only: rides, balloons (pink)
  solidTop: "#4a3a78", // Solid building look: top faces
  solidSide: "#2e2552", // Solid building look: front and back faces
  solidShade: "#1d1838", // Solid building look: left and right faces
  botNavy: "#232f58", // flyer bot bodies (lighter and darker faces derived)
  botDusk: "#1e1a35",
  botBone: "#cdc7e6",
  botPlum: "#4f2662",
  botMint: "#3fcf98",
  botPink: "#d34db6",
  botCyan: "#36bfd6",
  ink: "#e8ecff", // text (light on dark)
  muted: "#8a90c0", // secondary text
  danger: "#ff4d4d", // errors, reject
  statusOnTime: "#22d3ee", // delay status: on_time (cyan drone + route)
  statusAtRisk: "#ffb020", // delay status: at_risk (amber), low-stock ring
  statusLate: "#ff3b4f", // delay status: late (red, pulses), out-of-stock ring
  statusDeliveredLate: "#8c2f45", // delay status: delivered_late (dim red)
} as const;

export type ThemeColor = keyof typeof THEME;

export function cssVarName(token: ThemeColor): string {
  return `--color-${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}
