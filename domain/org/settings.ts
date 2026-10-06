// A company's delay rules, edited by the owner in /settings.
export type OrgRules = {
  slaDays: number;
  riskWindowHours: number;
  stallHours: number;
  handlingDays: number;
};

export const DEFAULT_RULES: OrgRules = { slaDays: 7, riskWindowHours: 24, stallHours: 48, handlingDays: 2 };

// slaDays 1–60 is from the spec; the other ranges are sane bounds, not business decisions.
export const RULE_LIMITS: Record<keyof OrgRules, { min: number; max: number }> = {
  slaDays: { min: 1, max: 60 },
  riskWindowHours: { min: 0, max: 336 },
  stallHours: { min: 1, max: 720 },
  handlingDays: { min: 0, max: 30 },
};

export type RulesCheck = { ok: true; rules: OrgRules } | { ok: false; fields: Partial<Record<keyof OrgRules, string>> };

export function checkRules(input: Partial<Record<keyof OrgRules, unknown>>): RulesCheck {
  const fields: Partial<Record<keyof OrgRules, string>> = {};
  const rules = { ...DEFAULT_RULES };
  for (const key of Object.keys(RULE_LIMITS) as (keyof OrgRules)[]) {
    const { min, max } = RULE_LIMITS[key];
    const value = input[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
      fields[key] = `Whole number from ${min} to ${max}`;
    } else {
      rules[key] = value;
    }
  }
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, rules };
}
