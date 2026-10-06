// ESLint flat config: Next.js presets plus the arch/* layer rules (CLAUDE.md → Architecture).
// Never silence an arch/* error; move the code.
import { existsSync, readdirSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// A later block replaces no-restricted-imports instead of merging, so every block gets the
// shared bans through restrict().
const SHARED = [{ regex: "^\\.\\./", message: "arch/alias: no parent-relative imports; use @/…" }];

const REACT = ["^(react|react-dom)($|/)", "no React here"];
const THREE = ["^(three($|/)|@react-three/)", "no Three.js here; 3D lives in engine/"];
const NEXT = ["^next($|/)", "no Next.js here"];
const SUPABASE = ["^@supabase/", "Supabase is only for platform/"];
const SERVER_ONLY = ["^server-only$", "server-only code belongs in platform/ or features/<x>/server/"];

function restrict(layer, bans) {
  return {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          ...SHARED,
          ...bans.map(([regex, why]) => ({ regex, message: `arch/${layer}: ${why}` })),
        ],
      },
    ],
  };
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// One pair of blocks per feature folder, so "other features" can be named in the ban.
const features = existsSync("features")
  ? readdirSync("features", { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

const featureBlocks = features.flatMap((name) => {
  const x = escape(name);
  const otherFeature = [`^@/features/(?!${x}($|/))`, "features never import other features; wire them in app/_experience/Experience.tsx"];
  return [
    {
      name: `arch/features/${name}`,
      files: [`features/${name}/**`],
      rules: restrict(`features/${name}`, [
        ["^@/(app|platform)($|/)", "client feature code may import only its own folder, domain, engine, ui, config"],
        otherFeature,
        [`^@/features/${x}/server($|/)`, "client code never imports its own server/ folder"],
        SUPABASE,
        SERVER_ONLY,
      ]),
    },
    {
      name: `arch/features/${name}/server`,
      files: [`features/${name}/server/**`],
      rules: restrict(`features/${name}/server`, [
        ["^@/app($|/)", "server code never imports app/"],
        otherFeature,
      ]),
    },
  ];
});

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "node_modules/**", "public/**", "next-env.d.ts"]),

  { name: "arch/alias", files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"], rules: restrict("alias", []) },

  {
    name: "arch/domain",
    files: ["domain/**"],
    rules: {
      ...restrict("domain", [
        ["^@/(?!domain($|/))", "domain imports only domain"],
        REACT,
        THREE,
        NEXT,
        SUPABASE,
        SERVER_ONLY,
      ]),
      "no-restricted-properties": [
        "error",
        { object: "Date", property: "now", message: "arch/domain: time rules take `now` as an argument" },
      ],
    },
  },
  {
    name: "arch/ui",
    files: ["ui/**"],
    rules: restrict("ui", [["^@/", "ui imports nothing in the project"]]),
  },
  {
    name: "arch/config",
    files: ["config/**"],
    rules: restrict("config", [["^@/(?!(config|domain)($|/))", "config imports only domain"]]),
  },
  {
    name: "arch/platform",
    files: ["platform/**"],
    rules: restrict("platform", [
      ["^@/(?!(platform|domain|config)($|/))", "platform imports only domain and config"],
      REACT,
      THREE,
    ]),
  },
  {
    name: "arch/engine",
    files: ["engine/**"],
    rules: restrict("engine", [
      ["^@/(?!(engine|domain|ui|config)($|/))", "engine imports only domain, ui, config"],
      SUPABASE,
      SERVER_ONLY,
    ]),
  },

  ...featureBlocks,

  {
    name: "arch/app",
    files: ["app/**"],
    rules: restrict("app", [
      ["^@/features/[^/]+/(?!server$)", "import features only via @/features/<x> or @/features/<x>/server"],
    ]),
  },
]);
