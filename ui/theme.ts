// Palette for the 3D scene; must match ui/tokens.css. Dark look: slate sea, raised slate land, soft
// blue / amber / red status, slate cards — the same clean design as the light look.
export const THEME = {
  background: "#0f131c", // page + sky (with fog)
  surface: "#171c28", // panels, cards, ring discs
  ground: "#131824", // sea floor around the land
  floor: "#1c2230",
  body: "#252c3b",
  line: "#283043",
  road: "#1f2533",
  accent: "#5b8def",
  flow: "#5b8def",
  neon: "#3b445a", // state borders, pins
  open: "#3fbf7f",
  openBuilding: "#2f9663",
  pending: "#9b7ae0",
  sold: "#5b8def",
  fun: "#f0a640",
  party: "#d968c0",
  solidTop: "#2c3447",
  solidSide: "#262d3e",
  solidShade: "#1b2130",
  botNavy: "#232f58",
  botDusk: "#1e1a35",
  botBone: "#cdc7e6",
  botPlum: "#4f2662",
  botMint: "#3fcf98",
  botPink: "#d34db6",
  botCyan: "#36bfd6",
  ink: "#e8ebf1", // text
  muted: "#8b93a6", // secondary text
  danger: "#ef5b5b",
  statusOnTime: "#5b8def",
  statusAtRisk: "#f0a640",
  statusLate: "#ef5b5b",
  statusDeliveredLate: "#8f4a4f",
  land: "#262d3e", // the raised land slab
} as const;

export type ThemeColor = keyof typeof THEME;
export type Palette = Record<ThemeColor, string>;

// Light look: the same map and panels as THEME, recoloured — white land on a pale sea, blue / amber /
// red status, white cards. Must match the [data-theme="light"] block in ui/tokens.css.
export const LIGHT_THEME = {
  background: "#eef1f6",
  surface: "#ffffff",
  ground: "#e4e8f0",
  floor: "#f3f5f9",
  body: "#e9edf3",
  line: "#e6e9ef",
  road: "#e1e6ee",
  accent: "#3f6fd8",
  flow: "#3f6fd8",
  neon: "#c5ccd8",
  open: "#2e9e5b",
  openBuilding: "#2e9e5b",
  pending: "#8a5cd6",
  sold: "#3f6fd8",
  fun: "#e5a23a",
  party: "#d34db6",
  solidTop: "#ffffff",
  solidSide: "#ffffff",
  solidShade: "#dfe4ec",
  botNavy: "#232f58",
  botDusk: "#1e1a35",
  botBone: "#ffffff",
  botPlum: "#4f2662",
  botMint: "#3fcf98",
  botPink: "#d34db6",
  botCyan: "#36bfd6",
  ink: "#1a1e26",
  muted: "#5f6673",
  danger: "#db4c4c",
  statusOnTime: "#3f6fd8",
  statusAtRisk: "#e5a23a",
  statusLate: "#db4c4c",
  statusDeliveredLate: "#d2918b",
  land: "#ffffff",
} as const satisfies Palette;

/** The two looks a viewer can toggle between. */
export const LOOKS = ["dark", "light"] as const;
export type Look = (typeof LOOKS)[number];
export const PALETTES: Record<Look, Palette> = { dark: THEME, light: LIGHT_THEME };

export function isLook(value: unknown): value is Look {
  return value === "dark" || value === "light";
}

export function cssVarName(token: ThemeColor): string {
  return `--color-${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

/** A token as a CSS colour that follows the page's look: `var(--color-status-late)`. */
export function cssVar(token: ThemeColor): string {
  return `var(${cssVarName(token)})`;
}
