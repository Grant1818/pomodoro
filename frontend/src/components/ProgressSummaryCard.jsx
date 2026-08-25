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
  isTimerPaused = true,
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

  const estimatedDoneLabel = useMemo(() => {
    if (remainingMinutes === 0) {
      return 'Now'
    }

    const estimatedDoneTime = new Date(now.getTime() + remainingMinutes * 60000)
    return formatClockTime(estimatedDoneTime)
  }, [now, remainingMinutes])

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
