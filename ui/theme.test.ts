import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEME, cssVarName, type ThemeColor } from "./theme";

function cssColors(): Map<string, string> {
  const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
  const block = css.match(/@theme\s*{([^}]*)}/)?.[1] ?? "";
  const colors = new Map<string, string>();
  for (const [, name, value] of block.matchAll(/(--color-[a-z0-9-]+):\s*(#[0-9a-f]{3,8})\s*;/gi)) {
    colors.set(name, value.toLowerCase());
  }
  return colors;
}

describe("theme", () => {
  const css = cssColors();
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

  it("cssVarName turns camelCase into kebab-case", () => {
    expect(cssVarName("statusDeliveredLate")).toBe("--color-status-delivered-late");
  });
});
