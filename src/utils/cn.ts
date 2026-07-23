type ClassValue = string | number | null | false | undefined | ClassValue[];

function flatten(value: ClassValue, out: string[]) {
  if (!value && value !== 0) return;
  if (Array.isArray(value)) {
    value.forEach((v) => flatten(v, out));
    return;
  }
  out.push(String(value));
}

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  values.forEach((v) => flatten(v, out));
  return out.join(" ");
}
