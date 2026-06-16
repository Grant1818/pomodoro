import '../css/summaryCard.css'
import { useEffect, useMemo, useState } from 'react'

function formatClockTime(date) {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Reusable summary panel that shows completion and estimated finish time.
function ProgressSummaryCard({
  completionPercentage,
  remainingMinutes,
  pauseExtensionMinutes = 0,
  isTimerPaused = false,
}) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [])

  const effectiveRemainingMinutes = useMemo(() => {
    const baseRemaining = Math.max(0, remainingMinutes)
    const pauseDelay = isTimerPaused ? Math.max(0, pauseExtensionMinutes) : 0
    return baseRemaining + pauseDelay
  }, [remainingMinutes, isTimerPaused, pauseExtensionMinutes])

  const estimatedDoneLabel = useMemo(() => {
    if (effectiveRemainingMinutes === 0) {
      return 'Now'
    }

    const estimatedDoneTime = new Date(now.getTime() + effectiveRemainingMinutes * 60000)
    return formatClockTime(estimatedDoneTime)
  }, [now, effectiveRemainingMinutes])

  return (
    <section className="progress-summary-card" aria-label="Progress summary">
      <div className="progress-summary-card__row">
        <p className="progress-summary-card__label">Progress</p>
        <p className="progress-summary-card__label progress-summary-card__label--right">Completion Time</p>
      </div>

      <div className="progress-summary-card__divider" aria-hidden="true"></div>

      <div className="progress-summary-card__row">
        <p className="progress-summary-card__value">{completionPercentage}% complete</p>
        <p className="progress-summary-card__value progress-summary-card__value--right">{estimatedDoneLabel}</p>
      </div>
    </section>
  )
}

export default ProgressSummaryCard
