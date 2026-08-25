import '../css/timerCard.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import refreshIcon from '../assets/restart-svg.svg'
import playIcon from '../assets/play-svg.svg'
import pauseIcon from '../assets/pause-svg.svg'
import nextIcon from '../assets/next-svg.svg'
import settingsIcon from '../assets/settings.png'
import { clampTimerMinutes, getDefaultTimerState, minutesToSeconds } from './timerState'
const CIRCUMFERENCE = 2 * Math.PI * 110

function formatTimeDisplay(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function normalizeTimeString(value) {
  const trimmedValue = String(value).trim()
  const hasSeparator = /[:;]/.test(trimmedValue)

  if (!hasSeparator) {
    const digitsOnly = trimmedValue.replace(/\D/g, '').slice(0, 4)

    if (digitsOnly.length === 0) {
      return '00:00'
    }

    const padded = digitsOnly.padStart(4, '0')
    const compactMinutes = padded.slice(0, 2)
    const compactSeconds = padded.slice(2, 4)
    return `${compactMinutes}:${compactSeconds}`
  }

  const [rawMinutes = '', rawSeconds = ''] = trimmedValue.split(/[:;]/)
  const minutesDigits = rawMinutes.replace(/\D/g, '').slice(0, 2)
  const secondsDigits = rawSeconds.replace(/\D/g, '').slice(0, 2)

  const normalizedMinutes = (minutesDigits || '0').padStart(2, '0')
  const normalizedSeconds = (secondsDigits || '0').padEnd(2, '0').slice(0, 2)

  return `${normalizedMinutes}:${normalizedSeconds}`
}

function parseNormalizedTime(value) {
  const normalized = normalizeTimeString(value)
  const [minutesText, secondsText] = normalized.split(':')
  const minutes = Number.parseInt(minutesText, 10)
  const seconds = Number.parseInt(secondsText, 10)
  return { normalized, minutes, seconds }
}

// Receives lifted timer state from Home so each task keeps its own independent timer.
function TimerCard({
  selectedTaskId,
  taskTimers,
  onTaskTimersChange,
  onPomodoroComplete,
  workDurationMinutes,
  breakDurationMinutes,
  onTimerSettingsSave,
}) {
  const [isRingtoneMuted, setIsRingtoneMuted] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [draftTimerValue, setDraftTimerValue] = useState('')
  const [draftWorkValue, setDraftWorkValue] = useState('25:00')
  const [draftBreakValue, setDraftBreakValue] = useState('05:00')
  const [unselectedTimerSeconds, setUnselectedTimerSeconds] = useState(null)
  const [unselectedTimerState, setUnselectedTimerState] = useState(null)
  const [settingsError, setSettingsError] = useState('')
  const audioContextRef = useRef(null)
  const settingsMenuRef = useRef(null)
  const settingsButtonRef = useRef(null)

  const workSeconds = minutesToSeconds(workDurationMinutes)
  const breakSeconds = minutesToSeconds(breakDurationMinutes)

  // Resolve the active timer, falling back to a fresh default if none yet exists.
  const effectiveStartSeconds = unselectedTimerSeconds ?? workSeconds
  const hasSelection = selectedTaskId != null
  const unselectedTimer = unselectedTimerState ?? {
    ...getDefaultTimerState(workSeconds),
    secondsRemaining: effectiveStartSeconds,
    totalSeconds: effectiveStartSeconds,
  }
  const timer =
    hasSelection && taskTimers[selectedTaskId]
      ? taskTimers[selectedTaskId]
      : unselectedTimer

  const timerTotalSeconds = timer.totalSeconds ?? (timer.mode === 'work' ? workSeconds : breakSeconds)
  const dashOffset = CIRCUMFERENCE - (timer.secondsRemaining / timerTotalSeconds) * CIRCUMFERENCE

  const playRingtone = useCallback(() => {
    if (isRingtoneMuted) {
      return
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      return
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass()
    }

    const context = audioContextRef.current
    context.resume().catch(() => {
      // Ignore resume failures; some browsers gate this behind user gestures.
    })

    const notes = [880, 988, 1175]
    const startAt = context.currentTime + 0.02

    notes.forEach((frequency, index) => {
      const noteStart = startAt + index * 0.2
      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = 'triangle'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.linearRampToValueAtTime(0.2, noteStart + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.18)

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.start(noteStart)
      oscillator.stop(noteStart + 0.2)
    })
  }, [isRingtoneMuted])

  const primeRingtone = useCallback(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      return
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass()
    }

    audioContextRef.current.resume().catch(() => {
      // Ignore resume failures; some browsers gate this behind user gestures.
    })
  }, [])

  useEffect(() => () => {
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {
        // Ignore close errors on unmount.
      })
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isSettingsOpen) {
        return
      }

      const clickedInsideMenu = settingsMenuRef.current?.contains(event.target)
      const clickedSettingsButton = settingsButtonRef.current?.contains(event.target)

      if (!clickedInsideMenu && !clickedSettingsButton) {
        setIsSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSettingsOpen])

  // Tick the selected task's timer once per second while it is running.
  useEffect(() => {
    if (!timer.isRunning) {
      return
    }

    const timerId = window.setInterval(() => {
      if (hasSelection) {
        let shouldPlayRingtone = false
        let shouldRecordPomodoro = false

        onTaskTimersChange((prev) => {
          const current = prev[selectedTaskId] || getDefaultTimerState(workSeconds)

          if (current.secondsRemaining <= 1) {
            shouldPlayRingtone = true
            if (current.mode === 'work') {
              // Work session ended: switch to break and record completion once.
              shouldRecordPomodoro = true
              return {
                ...prev,
                [selectedTaskId]: { secondsRemaining: breakSeconds, totalSeconds: breakSeconds, mode: 'break', isRunning: false },
              }
            }
            // Break ended: move to work mode without auto-starting.
            return {
              ...prev,
              [selectedTaskId]: { secondsRemaining: workSeconds, totalSeconds: workSeconds, mode: 'work', isRunning: false },
            }
          }

          return {
            ...prev,
            [selectedTaskId]: { ...current, secondsRemaining: current.secondsRemaining - 1 },
          }
        })

        if (shouldPlayRingtone) {
          playRingtone()
        }
        if (shouldRecordPomodoro) {
          onPomodoroComplete(selectedTaskId)
        }
        return
      }

      setUnselectedTimerState((current) => {
        const activeTimer = current || {
          ...getDefaultTimerState(workSeconds),
          secondsRemaining: effectiveStartSeconds,
          totalSeconds: effectiveStartSeconds,
          isRunning: true,
        }

        if (activeTimer.secondsRemaining <= 1) {
          playRingtone()
          if (activeTimer.mode === 'work') {
            return {
              secondsRemaining: breakSeconds,
              totalSeconds: breakSeconds,
              mode: 'break',
              isRunning: false,
            }
          }

          return {
            secondsRemaining: workSeconds,
            totalSeconds: workSeconds,
            mode: 'work',
            isRunning: false,
          }
        }

        return {
          ...activeTimer,
          secondsRemaining: activeTimer.secondsRemaining - 1,
        }
      })
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [
    timer.isRunning,
    hasSelection,
    selectedTaskId,
    onTaskTimersChange,
    onPomodoroComplete,
    playRingtone,
    workSeconds,
    breakSeconds,
    effectiveStartSeconds,
  ])

  // Merges a partial update into the selected task's timer state.
  const patchTimer = (patch) => {
    if (!hasSelection) {
      setUnselectedTimerState((prev) => ({
        ...(prev || {
          ...getDefaultTimerState(workSeconds),
          secondsRemaining: effectiveStartSeconds,
          totalSeconds: effectiveStartSeconds,
        }),
        ...patch,
      }))
      return
    }
    onTaskTimersChange((prev) => ({
      ...prev,
      [selectedTaskId]: { ...(prev[selectedTaskId] || getDefaultTimerState(workSeconds)), ...patch },
    }))
  }

  const handlePlay = () => {
    if (timer.isRunning) return
    primeRingtone()

    if (!hasSelection) {
      setUnselectedTimerState((prev) =>
        prev
          ? { ...prev, isRunning: true }
          : {
              secondsRemaining: effectiveStartSeconds,
              totalSeconds: effectiveStartSeconds,
              mode: 'work',
              isRunning: true,
            },
      )
      return
    }

    // Seed task timer with the unselected value if it hasn't been set yet.
    if (!taskTimers[selectedTaskId]) {
      onTaskTimersChange((prev) => ({
        ...prev,
        [selectedTaskId]: {
          secondsRemaining: effectiveStartSeconds,
          totalSeconds: effectiveStartSeconds,
          mode: 'work',
          isRunning: true,
        },
      }))
      return
    }
    patchTimer({ isRunning: true })
  }

  const handlePause = () => {
    if (!timer.isRunning) return
    patchTimer({ isRunning: false })
  }

  const handleSkipSegment = () => {
    if (hasSelection && timer.mode === 'work') {
      onPomodoroComplete(selectedTaskId)
    }

    if (!hasSelection) {
      setUnselectedTimerState((prev) => {
        const current = prev || {
          ...getDefaultTimerState(workSeconds),
          secondsRemaining: effectiveStartSeconds,
          totalSeconds: effectiveStartSeconds,
          isRunning: false,
        }

        if (current.mode === 'work') {
          return {
            ...current,
            mode: 'break',
            secondsRemaining: breakSeconds,
            totalSeconds: breakSeconds,
            isRunning: false,
          }
        }

        return {
          ...current,
          mode: 'work',
          secondsRemaining: workSeconds,
          totalSeconds: workSeconds,
          isRunning: false,
        }
      })
      return
    }

    onTaskTimersChange((prev) => {
      const current = prev[selectedTaskId] || {
        ...getDefaultTimerState(workSeconds),
        secondsRemaining: effectiveStartSeconds,
        totalSeconds: effectiveStartSeconds,
      }

      if (current.mode === 'work') {
        return {
          ...prev,
          [selectedTaskId]: {
            ...current,
            mode: 'break',
            secondsRemaining: breakSeconds,
            totalSeconds: breakSeconds,
            isRunning: false,
          },
        }
      }

      return {
        ...prev,
        [selectedTaskId]: {
          ...current,
          mode: 'work',
          secondsRemaining: workSeconds,
          totalSeconds: workSeconds,
          isRunning: false,
        },
      }
    })
  }

  const handleRestart = () => {
    if (!hasSelection) {
      setUnselectedTimerState({
        ...getDefaultTimerState(workSeconds),
        secondsRemaining: effectiveStartSeconds,
        totalSeconds: effectiveStartSeconds,
        isRunning: false,
      })
      return
    }
    onTaskTimersChange((prev) => ({
      ...prev,
      [selectedTaskId]: getDefaultTimerState(workSeconds),
    }))
  }

  const toggleSettings = () => {
    setDraftTimerValue('')
    setDraftWorkValue(`${String(workDurationMinutes).padStart(2, '0')}:00`)
    setDraftBreakValue(`${String(breakDurationMinutes).padStart(2, '0')}:00`)
    setSettingsError('')
    setIsSettingsOpen((prev) => !prev)
  }

  const adjustByFive = (setter, currentValue, delta) => {
    const { minutes } = parseNormalizedTime(currentValue)
    const nextMinutes = clampTimerMinutes(minutes + delta)
    setter(`${String(nextMinutes).padStart(2, '0')}:00`)
  }

  const handleTimeInputChange = (setter, nextValue) => {
    const digitsOnly = nextValue.replace(/\D/g, '').slice(-4)

    if (digitsOnly.length === 0) {
      setter('')
      return
    }

    const padded = digitsOnly.padStart(4, '0')
    const minutes = padded.slice(0, 2)
    const seconds = padded.slice(2, 4)
    setter(`${minutes}:${seconds}`)
  }

  const saveSettings = () => {
    const timerParsed = parseNormalizedTime(draftTimerValue)
    const workParsed = parseNormalizedTime(draftWorkValue)
    const breakParsed = parseNormalizedTime(draftBreakValue)

    if (draftTimerValue.trim() === '') {
      setSettingsError('Enter current time in xx:xx format.')
      return
    }

    if (timerParsed.minutes > 25 || timerParsed.seconds > 59) {
      setSettingsError('Current time must be between 00:01 and 25:00.')
      return
    }

    const nextTimerSeconds = timerParsed.minutes * 60 + timerParsed.seconds
    if (nextTimerSeconds < 1 || nextTimerSeconds > 1500) {
      setSettingsError('Current time must be between 00:01 and 25:00.')
      return
    }

    if (workParsed.seconds !== 0 || breakParsed.seconds !== 0) {
      setSettingsError('Pomodoro and break must end with :00.')
      return
    }

    const nextWorkMinutes = workParsed.minutes
    const nextBreakMinutes = breakParsed.minutes

    if (
      nextWorkMinutes < 5
      || nextWorkMinutes > 60
      || nextBreakMinutes < 5
      || nextBreakMinutes > 60
      || nextWorkMinutes % 5 !== 0
      || nextBreakMinutes % 5 !== 0
    ) {
      setSettingsError('Work and break must be in 5-minute increments between 5 and 60.')
      return
    }

    // Persist normalized display values so partial values like "25:" become "25:00".
    setDraftTimerValue(timerParsed.normalized)
    setDraftWorkValue(workParsed.normalized)
    setDraftBreakValue(breakParsed.normalized)

    onTimerSettingsSave?.({ nextWorkMinutes, nextBreakMinutes })

    if (hasSelection) {
      onTaskTimersChange((prev) => ({
        ...prev,
        [selectedTaskId]: {
          ...(prev[selectedTaskId] || getDefaultTimerState(minutesToSeconds(nextWorkMinutes))),
          secondsRemaining: nextTimerSeconds,
          totalSeconds: nextTimerSeconds,
          isRunning: false,
        },
      }))
    } else {
      setUnselectedTimerSeconds(nextTimerSeconds)
      setUnselectedTimerState({
        secondsRemaining: nextTimerSeconds,
        totalSeconds: nextTimerSeconds,
        mode: 'work',
        isRunning: false,
      })
    }

    setSettingsError('')
    setIsSettingsOpen(false)
  }

  return (
    <section className="timer-card" aria-label="Pomodoro timer">

      {/* Top row keeps ringtone on the left and break/settings controls on the right. */}
      <div className="timer-card__task-row">
        <div className="timer-card__top-left">
          <button
            type="button"
            className="timer-card__ringtone-toggle"
            onClick={() => setIsRingtoneMuted((prev) => !prev)}
            aria-label={isRingtoneMuted ? 'Unmute ringtone' : 'Mute ringtone'}
            title={isRingtoneMuted ? 'Unmute ringtone' : 'Mute ringtone'}
          >
            <svg
              className="timer-card__ringtone-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M4 14h4l5 4V6L8 10H4z" />
              <path d="M16 9.2a4.8 4.8 0 0 1 0 5.6" />
              <path d="M18.7 6.9a8 8 0 0 1 0 10.2" />
              {isRingtoneMuted && <path d="M5 5l14 14" />}
            </svg>
          </button>
          <span className="timer-card__ringtone-label">Ringtone</span>
        </div>

        <div className="timer-card__top-right">
          {/* Mode badge only visible during break */}
          {timer.mode === 'break' && hasSelection && (
            <span className="timer-card__mode-badge">Break</span>
          )}

          <button
            type="button"
            className="timer-card__settings-button"
            aria-label="Open timer settings"
            title="Open timer settings"
            onClick={toggleSettings}
            ref={settingsButtonRef}
          >
            <img src={settingsIcon} alt="" className="timer-card__settings-icon" aria-hidden="true" />
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="timer-settings" ref={settingsMenuRef}>
          <p className="timer-settings__label">Edit Current Time
          </p>
          <input
            type="text"
            inputMode="numeric"
            className="timer-settings__input"
            placeholder="00:00"
            value={draftTimerValue}
            onChange={(event) => handleTimeInputChange(setDraftTimerValue, event.target.value)}
          />

          <p className="timer-settings__label">Edit Pomodoro Increment</p>
          <div className="timer-settings__row">
            <input
              type="text"
              inputMode="numeric"
              className="timer-settings__input"
              value={draftWorkValue}
              onChange={(event) => handleTimeInputChange(setDraftWorkValue, event.target.value)}
            />
            <div className="timer-settings__stepper">
              <button
                type="button"
                className="timer-settings__stepper-button"
                onClick={() => adjustByFive(setDraftWorkValue, draftWorkValue, 5)}
              >
                ▲
              </button>
              <button
                type="button"
                className="timer-settings__stepper-button"
                onClick={() => adjustByFive(setDraftWorkValue, draftWorkValue, -5)}
              >
                ▼
              </button>
            </div>
          </div>

          <p className="timer-settings__label">Edit Break Time</p>
          <div className="timer-settings__row">
            <input
              type="text"
              inputMode="numeric"
              className="timer-settings__input"
              value={draftBreakValue}
              onChange={(event) => handleTimeInputChange(setDraftBreakValue, event.target.value)}
            />
            <div className="timer-settings__stepper">
              <button
                type="button"
                className="timer-settings__stepper-button"
                onClick={() => adjustByFive(setDraftBreakValue, draftBreakValue, 5)}
              >
                ▲
              </button>
              <button
                type="button"
                className="timer-settings__stepper-button"
                onClick={() => adjustByFive(setDraftBreakValue, draftBreakValue, -5)}
              >
                ▼
              </button>
            </div>
          </div>

          {settingsError && <p className="timer-settings__error">{settingsError}</p>}

          <div className="timer-settings__actions">
            <button
              type="button"
              className="timer-settings__cancel"
              onClick={() => {
                setSettingsError('')
                setIsSettingsOpen(false)
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="timer-settings__save"
              onClick={saveSettings}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Circular progress display */}
      <div className="timer-card__display">
        <svg
          className="timer-card__circle-bg"
          width="240"
          height="240"
          viewBox="0 0 240 240"
          aria-hidden="true"
        >
          <circle cx="120" cy="120" r="110" />
        </svg>

        <svg
          className="timer-card__circle-progress"
          width="240"
          height="240"
          viewBox="0 0 240 240"
          aria-hidden="true"
        >
          <circle
            cx="120"
            cy="120"
            r="110"
            style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: -dashOffset }}
          />
        </svg>

        <p className="timer-card__time">{formatTimeDisplay(timer.secondsRemaining)}</p>
      </div>

      {/* Controls: restart | play | pause — always all three visible */}
      <div className="timer-card__controls">
        <button
          type="button"
          className="timer-card__control-button"
          aria-label="Restart timer"
          title="Restart timer"
          onClick={handleRestart}
          disabled={timer.isRunning === false && !hasSelection && unselectedTimerState == null}
        >
          <img src={refreshIcon} alt="" className="timer-card__control-image" aria-hidden="true" />
        </button>

        {timer.isRunning ? (
          <button
            type="button"
            className="timer-card__control-button"
            aria-label="Pause timer"
            title="Pause timer"
            onClick={handlePause}
            disabled={!timer.isRunning}
          >
            <img src={pauseIcon} alt="" className="timer-card__control-image" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="timer-card__control-button"
            aria-label="Start timer"
            title="Start timer"
            onClick={handlePlay}
          >
            <img src={playIcon} alt="" className="timer-card__control-image" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          className="timer-card__control-button"
          aria-label="Skip segment"
          title="Skip segment"
          onClick={handleSkipSegment}
          disabled={false}
        >
          <img src={nextIcon} alt="" className="timer-card__control-image" aria-hidden="true" />
        </button>
      </div>

    </section>
  )
}

export default TimerCard
