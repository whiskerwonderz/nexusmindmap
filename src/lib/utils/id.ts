export function generateId(): string {
  return crypto.randomUUID();
}

export function shortId(): string {
  return crypto.randomUUID().slice(0, 8);
}
