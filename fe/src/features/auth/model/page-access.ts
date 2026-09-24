export type PageAccess =
  | { kind: "public" | "authenticated" | "missing" }
  | { kind: "team"; id: number; permission: "public" | "member" | "manager" }
  | { kind: "match"; id: number; permission: "member" | "manager" }
  | { kind: "inquiry"; id: number };

function resourceId(value: string) {
  const id = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function getPageAccess(pathname: string): PageAccess {
  const parts = pathname.split("/").filter(Boolean);
  const [section, resource, ...rest] = parts;
  if (section === "profile") return { kind: "authenticated" };
  if (section === "inquiries") {
    if (!resource || resource === "new") return { kind: "authenticated" };
    const id = resourceId(resource);
    return id ? { kind: "inquiry", id } : { kind: "missing" };
  }
  if ((section === "team" || section === "match") && resource) {
    const id = resourceId(resource);
    if (!id) return { kind: "missing" };
    if (section === "match") {
      return { kind: "match", id, permission: rest.length ? "manager" : "member" };
    }
    const memberPages = ["member", "match", "statistics", "ranking"];
    const permission = !rest.length ? "public"
      : rest.length === 1 && memberPages.includes(rest[0]) ? "member" : "manager";
    return { kind: "team", id, permission };
  }
  return { kind: "public" };
}

export function canAccessTeam(
  members: ReadonlyArray<{ userId: number | null; status: string; role: string }>,
  userId: number,
  permission: "member" | "manager",
) {
  return members.some((member) => member.userId === userId && member.status === "ACTIVE" &&
    (permission === "member" || member.role === "OWNER" || member.role === "SUB_MANAGER"));
}

export function isPageAccessFailure(status: number) {
  return status === 401 || status === 403 || status === 404;
}
