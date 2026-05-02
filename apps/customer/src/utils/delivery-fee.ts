const TIERS: [number, number][] = [
  [2, 1.5],
  [5, 2.5],
  [10, 4.0],
  [15, 6.0],
  [Infinity, 8.0],
]

export function deliveryFee(km: number): number {
  return TIERS.find(([max]) => km <= max)![1]
}
