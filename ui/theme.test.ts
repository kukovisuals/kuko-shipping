import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LIGHT_THEME, THEME, cssVarName, type ThemeColor } from "./theme";

const CSS = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

function cssColors(selector: RegExp): Map<string, string> {
  const block = CSS.match(selector)?.[1] ?? "";
  const colors = new Map<string, string>();
  for (const [, name, value] of block.matchAll(/(--color-[a-z0-9-]+):\s*(#[0-9a-f]{3,8})\s*;/gi)) {
    colors.set(name, value.toLowerCase());
  }
  return colors;
}

describe("theme", () => {
  const css = cssColors(/@theme(?:\s+static)?\s*{([^}]*)}/);
  const light = cssColors(/\[data-theme="light"\]\s*{([^}]*)}/);
  const tokens = Object.keys(THEME) as ThemeColor[];

  it("every THEME colour has the same value in tokens.css", () => {
    for (const token of tokens) {
      expect(css.get(cssVarName(token)), token).toBe(THEME[token].toLowerCase());
    }
  });

  it("tokens.css has no colour that THEME lacks", () => {
    const names = new Set(tokens.map(cssVarName));
    expect([...css.keys()].filter((name) => !names.has(name))).toEqual([]);
  });

  it("the light look sets every token, with the same value as LIGHT_THEME", () => {
    expect(Object.keys(LIGHT_THEME).sort()).toEqual([...tokens].sort());
    for (const token of tokens) {
      expect(light.get(cssVarName(token)), token).toBe(LIGHT_THEME[token].toLowerCase());
    }
    expect(light.size).toBe(tokens.length);
  });

  it("cssVarName turns camelCase into kebab-case", () => {
    expect(cssVarName("statusDeliveredLate")).toBe("--color-status-delivered-late");
  });
});
