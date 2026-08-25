export const DEFAULT_WORK_MINUTES = 25
export const DEFAULT_BREAK_MINUTES = 5

export function minutesToSeconds(minutes) {
  return minutes * 60
}

export function clampTimerMinutes(minutes) {
  return Math.max(5, Math.min(60, minutes))
}

// Returns a fresh default timer state (work mode, not running).
export function getDefaultTimerState(workSeconds = minutesToSeconds(DEFAULT_WORK_MINUTES)) {
  return { secondsRemaining: workSeconds, totalSeconds: workSeconds, mode: 'work', isRunning: false }
}
