export function isPositiveInteger(value: number) {
  return /^\+?(0|[1-9]\d*)$/.test(value.toString());
}

export function generateRange(start: number, end: number, step = 1): number[] {
  return Array(Math.ceil((end - start) / step))
    .fill(start)
    .map((x, y) => x + y * step);
}
