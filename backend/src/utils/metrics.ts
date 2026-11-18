const MAX_LATENCY_SAMPLES = 500

interface RuntimeMetricsState {
  startedAt: Date
  totalRequests: number
  status2xx: number
  status4xx: number
  status5xx: number
  authFailures: number
  dbFailures: number
  playbackErrors: number
  latenciesMs: number[]
}

const state: RuntimeMetricsState = {
  startedAt: new Date(),
  totalRequests: 0,
  status2xx: 0,
  status4xx: 0,
  status5xx: 0,
  authFailures: 0,
  dbFailures: 0,
  playbackErrors: 0,
  latenciesMs: [],
}

export function recordRequestMetrics(statusCode: number, durationMs: number): void {
  state.totalRequests++
  if (statusCode >= 500) {
    state.status5xx++
  } else if (statusCode >= 400) {
    state.status4xx++
  } else {
    state.status2xx++
  }

  state.latenciesMs.push(durationMs)
  if (state.latenciesMs.length > MAX_LATENCY_SAMPLES) {
    state.latenciesMs.shift()
  }
}

export function recordAuthFailure(): void {
  state.authFailures++
}

export function recordDbFailure(): void {
  state.dbFailures++
}

export function recordPlaybackError(): void {
  state.playbackErrors++
}

export function getRuntimeMetrics() {
  const sorted = [...state.latenciesMs].sort((a, b) => a - b)
  const count = sorted.length
  const avgMs = count > 0 ? sorted.reduce((a, b) => a + b, 0) / count : 0
  const p95Ms = count > 0 ? sorted[Math.min(count - 1, Math.floor(count * 0.95))] : 0
  const maxMs = count > 0 ? sorted[count - 1] : 0

  return {
    startedAt: state.startedAt.toISOString(),
    uptimeSeconds: Math.round((Date.now() - state.startedAt.getTime()) / 1000),
    requests: {
      total: state.totalRequests,
      success2xx: state.status2xx,
      clientError4xx: state.status4xx,
      serverError5xx: state.status5xx,
    },
    latencyMs: {
      avg: Number(avgMs.toFixed(2)),
      p95: Number(p95Ms.toFixed(2)),
      max: Number(maxMs.toFixed(2)),
      samples: count,
    },
    securityAndReliability: {
      authFailures: state.authFailures,
      dbFailures: state.dbFailures,
      playbackErrors: state.playbackErrors,
    },
  }
}

