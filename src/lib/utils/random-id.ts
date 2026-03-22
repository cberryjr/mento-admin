let counter = 0;

export function randomId(): string {
  counter += 1;
  return `tmp_${counter}_${Date.now().toString(36)}`;
}
