export type ListStatus = "active" | "archived";

export function parseListStatus(raw: string | undefined): ListStatus {
  return raw === "archived" ? "archived" : "active";
}
