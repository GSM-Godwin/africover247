export interface AssetField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  required: boolean;
  hint?: string;
  options?: string[];
}

export function parseAssetFields(
  raw: string | AssetField[] | null | undefined,
): AssetField[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as AssetField[];
    } catch {
      return [];
    }
  }
  return [];
}
