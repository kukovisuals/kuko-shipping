export const ROLES = ["owner", "staff", "viewer"] as const;
export type Role = (typeof ROLES)[number];

/** read: see everything · write: movements, events, imports, acks · admin: settings, warehouses, members */
export type Permission = "read" | "write" | "admin";

const GRANTS: Record<Role, readonly Permission[]> = {
  owner: ["read", "write", "admin"],
  staff: ["read", "write"],
  viewer: ["read"],
};

export function can(role: Role, permission: Permission): boolean {
  return GRANTS[role].includes(permission);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
