import '../css/taskCard.css'
import { useEffect, useRef, useState } from 'react'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

// Renders the task card UI and manages task creation/list state.
function TaskCard({
  title = 'Tasks',
  buttonLabel = 'Add Task +',
  tasks,
  onTasksChange,
}) {
  // Controls whether we show the add-task form or the default task list view.
  const [isAddingTask, setIsAddingTask] = useState(false)
  // Stores the task name text entered by the user.
  const [taskName, setTaskName] = useState('')
  // Tracks whether the task name input should show an error state.
  const [taskNameHasError, setTaskNameHasError] = useState(false)
  // Stores the user-selected estimated pomodoro count for the new task.
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1)
  // Holds all saved tasks so they can be rendered above the Add Task button.
  const [localTasks, setLocalTasks] = useState([])
  // Stores the id of the task currently being edited in the inline form.
  const [editingTaskId, setEditingTaskId] = useState(null)
  // Controls the header menu visibility.
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const headerMenuRef = useRef(null)
  const headerMenuButtonRef = useRef(null)

  const taskItems = tasks ?? localTasks
  const setTaskItems = onTasksChange ?? setLocalTasks

  const toTaskViewModel = (project) => ({
    id: project.id,
    name: project.name,
    completedPomodoros: project.actualPomodoros,
    estimatedPomodoros: project.estimatedPomodoros,
  })

  const loadProjects = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`)
      if (!response.ok) {
        throw new Error('Failed to load projects')
      }

      const projects = await response.json()
      setTaskItems(projects.map(toTaskViewModel))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Increases the estimated pomodoro count by one.
  const incrementPomodoros = () => {
    setEstimatedPomodoros((prev) => prev + 1)
  }

  // Decreases the estimated pomodoro count, but never below 1.
  const decrementPomodoros = () => {
    setEstimatedPomodoros((prev) => Math.max(1, prev - 1))
  }

  // Keeps the numeric input valid and clamps it to a minimum of 1.
  const handlePomodoroInput = (event) => {
    const numericValue = Number.parseInt(event.target.value, 10)

    if (Number.isNaN(numericValue)) 
    {
      setEstimatedPomodoros(1)
      return
    }

    setEstimatedPomodoros(Math.max(1, numericValue))
  }

  // Resets all form fields and returns to the default card view.
  const resetTaskForm = () => {
    setTaskName('')
    setTaskNameHasError(false)
    setEstimatedPomodoros(1)
    setEditingTaskId(null)
    setIsAddingTask(false)
  }

  const toggleHeaderMenu = () => {
    setIsHeaderMenuOpen((prev) => !prev)
  }

  const handleDeleteAllTasks = async () => {
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete all tasks')
      }

      setTaskItems([])
      resetTaskForm()
      setIsHeaderMenuOpen(false)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleOpenTaskEdit = (task) => {
    setTaskName(task.name)
    setEstimatedPomodoros(task.estimatedPomodoros)
    setTaskNameHasError(false)
    setEditingTaskId(task.id)
    setIsAddingTask(true)
    setIsHeaderMenuOpen(false)
  }

  const handleDeleteTask = async () => {
    if (editingTaskId === null) {
      return
    }

    setIsDeleting(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${editingTaskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      setTaskItems((prev) => prev.filter((task) => task.id !== editingTaskId))
      resetTaskForm()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isHeaderMenuOpen) {
        return
      }

      const clickedInsideMenu = headerMenuRef.current?.contains(event.target)
      const clickedMenuButton = headerMenuButtonRef.current?.contains(event.target)

      if (!clickedInsideMenu && !clickedMenuButton) {
        setIsHeaderMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isHeaderMenuOpen])

  // Validates and saves a new task, then clears and closes the form.
  const handleSaveTask = async () => {
    // Trim whitespace so a name like "   " is treated as empty.
    const trimmedName = taskName.trim()

    // Do not save blank tasks.
    if (!trimmedName) 
    {
      setTaskNameHasError(true)
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    const projectPayload = {
      name: trimmedName,
      estimatedPomodoros,
      actualPomodoros: 0,
      totalTimeSpent: 0,
    }

    try {
      if (editingTaskId !== null) {
        const existingTask = taskItems.find((task) => task.id === editingTaskId)
        const response = await fetch(`${API_BASE_URL}/api/projects/${editingTaskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...projectPayload,
            actualPomodoros: existingTask?.completedPomodoros ?? 0,
            totalTimeSpent: (existingTask?.completedPomodoros ?? 0) * 25,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update task')
        }

        const updatedProject = await response.json()
        setTaskItems((prev) =>
          prev.map((task) =>
            task.id === editingTaskId ? toTaskViewModel(updatedProject) : task,
          ),
        )
      } else {
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectPayload),
        })

        if (!response.ok) {
          throw new Error('Failed to create task')
        }

        const createdProject = await response.json()
        setTaskItems((prev) => [...prev, toTaskViewModel(createdProject)])
      }

      resetTaskForm()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="task-card" aria-label="Task card">
      {/* Card header with title and menu button. */}
      <div className="task-card__header">
        <h1 className="task-card__title">{title}</h1>
        <button
          type="button"
          className="task-card__menu-button"
          aria-label="Open task menu"
          onClick={toggleHeaderMenu}
          ref={headerMenuButtonRef}
        >
          {/* Three decorative bars for the menu icon. */}
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>

        {isHeaderMenuOpen && (
          <div
            className="task-card__dropdown"
            role="menu"
            aria-label="Task card menu"
            ref={headerMenuRef}
          >
            <button
              type="button"
              className="task-card__dropdown-item"
              onClick={handleDeleteAllTasks}
            >
              Delete All
            </button>
          </div>
        )}
      </div>

      {/*
        When true: show the add-task form.
        When false: show existing tasks + the Add Task button.
      */}
      {isAddingTask ? (
        <div className="task-form" aria-label="Add task form">
          {/* Task name input section. */}
          <input
            id="task-name-input"
            type="text"
            className={`task-form__input${taskNameHasError ? ' task-form__input--error' : ''}`}
            value={taskName}
            // Keep input controlled by syncing typed text into React state.
            onChange={(event) => {
              setTaskName(event.target.value)
              if (taskNameHasError) {
                setTaskNameHasError(false)
              }
            }}
            placeholder="Enter your task:"
          />
          <p className="task-form__estimated-pomodoros">Estimated Pomodoros </p>

          <div className="task-form__pomodoro-row">
            <input
              type="number"
              min="1"
              className="task-form__number-input"
              value={estimatedPomodoros}
              // Manual typing path for setting pomodoro count.
              onChange={handlePomodoroInput}
            />

            <div className="task-form__stepper">
              <button
                type="button"
                className="task-form__stepper-button"
                aria-label="Increase estimated pomodoros"
                // Increment by one using the up control.
                onClick={incrementPomodoros}
              >
                ▲
              </button>
              <button
                type="button"
                className="task-form__stepper-button"
                aria-label="Decrease estimated pomodoros"
                // Decrement by one (clamped at minimum 1).
                onClick={decrementPomodoros}
              >
                ▼
              </button>
            </div>
          </div>

          {/* Form actions: cancel discards changes, save creates a task. */}
          <div className="task-form__actions">
            <div className="task-form__left-actions">
              <button type="button" className="task-form__cancel" onClick={resetTaskForm} disabled={isSaving || isDeleting}>Cancel</button>
              {editingTaskId !== null && (
                <button
                  type="button"
                  className="task-form__delete"
                  aria-label="Delete task"
                  title="Delete task"
                  onClick={handleDeleteTask}
                  disabled={isSaving || isDeleting}
                >
                  <svg
                    className="task-form__delete-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M4 7h16" />
                    <path d="M9 7V5h6v2" />
                    <path d="M7 7l1 12h8l1-12" />
                  </svg>
                </button>
              )}
            </div>
            <button type="button" className="task-form__save" onClick={handleSaveTask} disabled={isSaving || isDeleting}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {errorMessage && (
            <p className="task-card__error" role="alert">{errorMessage}</p>
          )}

          {isLoading && (
            <p className="task-card__status">Loading tasks...</p>
          )}

          {/* Render saved tasks only when at least one exists. */}
          {!isLoading && taskItems.length > 0 && (
            <div className="task-list" aria-label="Task list">
              {/* Each row shows task name on the left and progress on the right. */}
              {taskItems.map((task) => (
                <article key={task.id} className="task-list__item">
                  <p className="task-list__name">{task.name}</p>
                  <div className="task-list__right">
                    <p className="task-list__count">
                      {task.completedPomodoros}/{task.estimatedPomodoros}
                    </p>

                    <div className="task-list__menu-wrap">
                      <button
                        type="button"
                        className="task-list__menu-button"
                        aria-label={`Edit ${task.name}`}
                        onClick={() => handleOpenTaskEdit(task)}
                      >
                        <span aria-hidden="true" className="task-list__edit-icon">✎</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Opens the add-task form view. */}
          <button type="button" className="task-card__button" onClick={() => setIsAddingTask(true)}>
            {buttonLabel}
          </button>
        </>
      )}
    </section>
  )
}

export default TaskCard