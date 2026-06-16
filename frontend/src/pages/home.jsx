import '../css/home.css'
import TaskCard from '../components/TaskCard'
import ProgressSummaryCard from '../components/ProgressSummaryCard'
import { useMemo, useState } from 'react'

function Home() 
{
  const [tasks, setTasks] = useState([])
  const [pauseExtensionMinutes, setPauseExtensionMinutes] = useState(0)
  const [isTimerPaused, setIsTimerPaused] = useState(false)

  const completionPercentage = useMemo(() => {
    const totalEstimated = tasks.reduce((sum, task) => sum + task.estimatedPomodoros, 0)
    const totalCompleted = tasks.reduce((sum, task) => sum + task.completedPomodoros, 0)

    if (totalEstimated === 0) {
      return 0
    }

    const percentage = Math.round((totalCompleted / totalEstimated) * 100)
    return Math.min(100, Math.max(0, percentage))
  }, [tasks])

  const remainingMinutes = useMemo(() => {
    const remainingPomodoros = tasks.reduce((sum, task) => {
      const remaining = Math.max(0, task.estimatedPomodoros - task.completedPomodoros)
      return sum + remaining
    }, 0)

    return remainingPomodoros * 25
  }, [tasks])

  return (
    <main className="home-page">
      <div className="home-page__content">
        <TaskCard
          title="Tasks"
          buttonLabel="Add Task +"
          tasks={tasks}
          onTasksChange={setTasks}
          pauseExtensionMinutes={pauseExtensionMinutes}
          onPauseExtensionMinutesChange={setPauseExtensionMinutes}
          isTimerPaused={isTimerPaused}
          onTimerPausedChange={setIsTimerPaused}
        />
        <ProgressSummaryCard
          completionPercentage={completionPercentage}
          remainingMinutes={remainingMinutes}
          pauseExtensionMinutes={pauseExtensionMinutes}
          isTimerPaused={isTimerPaused}
        />
      </div>
    </main>
  )
}

export default Home
