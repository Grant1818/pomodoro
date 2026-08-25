import '../css/home.css'
import TaskCard from '../components/TaskCard'
import ProgressSummaryCard from '../components/ProgressSummaryCard'
import TimerCard from '../components/TimerCard'
import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_WORK_MINUTES,
  getDefaultTimerState,
  minutesToSeconds,
} from '../components/timerState'
import { useCallback, useMemo, useRef, useState } from 'react'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

function Home() 
{
  const [tasks, setTasks] = useState([])
  // Which task the timer is currently targeting.
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  // Per-task timer state: { [taskId]: { secondsRemaining, mode, isRunning } }
  const [taskTimers, setTaskTimers] = useState({})
  const [workDurationMinutes, setWorkDurationMinutes] = useState(DEFAULT_WORK_MINUTES)
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(DEFAULT_BREAK_MINUTES)
  const completionInFlightRef = useRef(new Set())

  const hasValidManualSelection = selectedTaskId != null && tasks.some((task) => task.id === selectedTaskId)
  const effectiveSelectedTaskId = tasks.length === 1
    ? tasks[0].id
    : hasValidManualSelection
      ? selectedTaskId
      : null

  const workSeconds = minutesToSeconds(workDurationMinutes)

  const selectedTask = tasks.find((t) => t.id === effectiveSelectedTaskId) ?? null
  const selectedTimer = effectiveSelectedTaskId != null
    ? taskTimers[effectiveSelectedTaskId] || getDefaultTimerState(workSeconds)
    : null

  const handleSelectTask = useCallback((nextTaskId) => {
    setTaskTimers((prev) => {
      if (
        effectiveSelectedTaskId == null
        || nextTaskId == null
        || effectiveSelectedTaskId === nextTaskId
      ) {
        return prev
      }

      const currentTaskTimer = prev[effectiveSelectedTaskId]
      if (!currentTaskTimer || currentTaskTimer.mode !== 'break') {
        return prev
      }

      return {
        ...prev,
        [nextTaskId]: {
          ...currentTaskTimer,
        },
      }
    })

    setSelectedTaskId(nextTaskId)
  }, [effectiveSelectedTaskId])

  // Completion percentage is specific to the selected task and updates every minute
  // based on active work-session progress.
  const completionPercentage = useMemo(() => {
    if (!selectedTask || selectedTask.estimatedPomodoros === 0) {
      return 0
    }

    const completedFromFinishedPomodoros = selectedTask.completedPomodoros * workSeconds
    const currentWorkProgressSeconds =
      selectedTimer && selectedTimer.mode === 'work'
        ? workSeconds - selectedTimer.secondsRemaining
        : 0
    const totalEstimatedSeconds = selectedTask.estimatedPomodoros * workSeconds

    return Math.min(
      100,
      Math.round(
        ((completedFromFinishedPomodoros + currentWorkProgressSeconds) / totalEstimatedSeconds) * 100,
      ),
    )
  }, [selectedTask, selectedTimer, workSeconds])

  // Remaining work minutes for the selected task, using live timer data for the current session.
  const remainingMinutes = useMemo(() => {
    if (!selectedTask) {
      return 0
    }
    const remainingPomodoros = Math.max(
      0,
      selectedTask.estimatedPomodoros - selectedTask.completedPomodoros,
    )
    const currentTimer = selectedTimer

    // During a break the current pomodoro count hasn't changed yet, so count all remaining.
    if (!currentTimer || currentTimer.mode === 'break') {
      return remainingPomodoros * workDurationMinutes
    }

    // Current session is one of the remaining pomodoros; use its live seconds for accuracy.
    const currentSessionMinutes = Math.ceil(currentTimer.secondsRemaining / 60)
    const laterPomodoros = Math.max(0, remainingPomodoros - 1)
    return currentSessionMinutes + laterPomodoros * workDurationMinutes
  }, [selectedTask, selectedTimer, workDurationMinutes])

  // Called by TimerCard when a 25-minute work session ends for a task.
  const handlePomodoroComplete = useCallback(async (taskId) => {
    if (completionInFlightRef.current.has(taskId)) {
      return
    }

    completionInFlightRef.current.add(taskId)

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${taskId}/completePomodoro`, {
        method: 'PUT',
      })
      if (response.ok) {
        await response.json()
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t,
          ),
        )
      }
    } catch (e) {
      console.error('Failed to record completed pomodoro', e)
    } finally {
      completionInFlightRef.current.delete(taskId)
    }
  }, [])

  return (
    <main className="home-page">
      <div className="home-page__content">
        <TimerCard
          selectedTaskId={effectiveSelectedTaskId}
          taskTimers={taskTimers}
          onTaskTimersChange={setTaskTimers}
          onPomodoroComplete={handlePomodoroComplete}
          workDurationMinutes={workDurationMinutes}
          breakDurationMinutes={breakDurationMinutes}
          onTimerSettingsSave={({ nextWorkMinutes, nextBreakMinutes }) => {
            setWorkDurationMinutes(nextWorkMinutes)
            setBreakDurationMinutes(nextBreakMinutes)
          }}
        />
        <TaskCard
          title="Tasks"
          buttonLabel="Add Task +"
          tasks={tasks}
          onTasksChange={setTasks}
          selectedTaskId={effectiveSelectedTaskId}
          onSelectTask={handleSelectTask}
          workDurationMinutes={workDurationMinutes}
        />
        <ProgressSummaryCard
          completionPercentage={completionPercentage}
          remainingMinutes={remainingMinutes}
          isTimerPaused={effectiveSelectedTaskId != null ? !(taskTimers[effectiveSelectedTaskId]?.isRunning ?? false) : true}
        />
      </div>
    </main>
  )
}

export default Home
