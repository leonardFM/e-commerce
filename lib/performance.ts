export function startTimer() {
  return process.hrtime.bigint()
}

export function elapsedMs(start: bigint) {
  return Number(process.hrtime.bigint() - start) / 1_000_000
}

export function getThresholdMs(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
