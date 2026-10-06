import { createContext, use, useMemo, type ReactNode } from "react";
import { Color } from "three";
import { PALETTES, type Look, type Palette, type ThemeColor } from "@/ui/theme";

// The scene's colours for the current look. R3F bridges React context into the <Canvas>, so every
// engine piece reads its colours here instead of from THEME.

export type ScenePalette = {
  look: Look;
  colors: Palette;
  /** A colour that blooms in the dark look (pushed above 1) and stays plain in the light look (no bloom there). */
  glow: (token: ThemeColor, strength?: number) => Color;
};

function makePalette(look: Look): ScenePalette {
  const colors = PALETTES[look];
  return {
    look,
    colors,
    glow: (token, strength = 2) => {
      const c = new Color(colors[token]);
      return look === "dark" ? c.multiplyScalar(strength) : c;
    },
  };
}

const PaletteContext = createContext<ScenePalette>(makePalette("dark"));

export function PaletteProvider({ look, children }: { look: Look; children: ReactNode }) {
  const value = useMemo(() => makePalette(look), [look]);
  return <PaletteContext value={value}>{children}</PaletteContext>;
}

export function usePalette(): ScenePalette {
  return use(PaletteContext);
}
