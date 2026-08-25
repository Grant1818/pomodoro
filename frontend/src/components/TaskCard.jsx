import '../css/taskCard.css'
import { useEffect, useRef, useState } from 'react'
import trashIcon from '../assets/trash (1).png'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

// Renders the task card UI and manages task creation/list state.
function TaskCard({
  title = 'Tasks',
  buttonLabel = 'Add Task +',
  tasks,
  onTasksChange,
  selectedTaskId,
  onSelectTask,
  workDurationMinutes = 25,
}) {
  // Controls whether we show the add-task form or the default task list view.
  const [isAddingTask, setIsAddingTask] = useState(false)
  // Stores the task name text entered by the user.
  const [taskName, setTaskName] = useState('')
  // Tracks whether the task name input should show an error state.
  const [taskNameHasError, setTaskNameHasError] = useState(false)
  // Stores the user-selected estimated pomodoro count for the new task.
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1)
  // Stores current completed pomodoros shown in edit mode as the left value.
  const [currentPomodoros, setCurrentPomodoros] = useState(0)
  // Holds all saved tasks so they can be rendered above the Add Task button.
  const [localTasks, setLocalTasks] = useState([])
  // Stores the id of the task currently being edited in the inline form.
  const [editingTaskId, setEditingTaskId] = useState(null)
  // Controls the header menu visibility.
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false)
  const [deleteConfirmationTask, setDeleteConfirmationTask] = useState(null)
  const [completedTaskPrompt, setCompletedTaskPrompt] = useState(null)
  const [lastTaskPrompt, setLastTaskPrompt] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const headerMenuRef = useRef(null)
  const headerMenuButtonRef = useRef(null)
  const completionSnapshotRef = useRef(new Map())
  const hasCompletionSnapshotRef = useRef(false)

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
    setEstimatedPomodoros((prev) => Math.min(100, prev + 1))
  }

  // Decreases the estimated pomodoro count, but never below 1.
  const decrementPomodoros = () => {
    setEstimatedPomodoros((prev) => Math.max(1, prev - 1))
  }

  // Keeps the numeric input valid and clamps it to a minimum of 1.
  const handlePomodoroInput = (event) => {
    if (event.target.value === '') {
      setEstimatedPomodoros('')
      return
    }

    const numericValue = Number.parseInt(event.target.value, 10)

    if (Number.isNaN(numericValue)) 
    {
      setEstimatedPomodoros('')
      return
    }

    setEstimatedPomodoros(Math.max(1, Math.min(100, numericValue)))
  }

  const handleCurrentPomodoroInput = (event) => {
    if (event.target.value === '') {
      setCurrentPomodoros('')
      return
    }

    const numericValue = Number.parseInt(event.target.value, 10)

    if (Number.isNaN(numericValue))
    {
      setCurrentPomodoros('')
      return
    }

    setCurrentPomodoros(Math.max(0, Math.min(100, numericValue)))
  }

  // Resets all form fields and returns to the default card view.
  const resetTaskForm = () => {
    setTaskName('')
    setTaskNameHasError(false)
    setEstimatedPomodoros(1)
    setCurrentPomodoros(0)
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
      onSelectTask?.(null)
      resetTaskForm()
      setIsHeaderMenuOpen(false)
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handleOpenTaskEdit = (task) => {
    setTaskName(task.name)
    setEstimatedPomodoros(task.estimatedPomodoros)
    setCurrentPomodoros(task.completedPomodoros)
    setTaskNameHasError(false)
    setEditingTaskId(task.id)
    setIsAddingTask(true)
    setIsHeaderMenuOpen(false)
  }

  const handleDeleteTask = async () => {
    if (editingTaskId === null) {
      return
    }

    const editingTask = taskItems.find((task) => task.id === editingTaskId)
    setDeleteConfirmationTask(
      editingTask ?? {
        id: editingTaskId,
        name: taskName.trim() || 'this task',
      },
    )
  }

  const handleDeleteTaskFromList = async (task) => {
    setDeleteConfirmationTask(task)
  }

  const deleteTaskById = async (taskToDelete) => {
    setIsDeleting(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${taskToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      setTaskItems((prev) => prev.filter((task) => task.id !== taskToDelete.id))
      if (selectedTaskId === taskToDelete.id) {
        onSelectTask?.(null)
      }

      if (editingTaskId === taskToDelete.id) {
        resetTaskForm()
      }
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmDeleteTask = async () => {
    if (!deleteConfirmationTask) {
      return
    }

    const taskToDelete = deleteConfirmationTask
    setDeleteConfirmationTask(null)
    await deleteTaskById(taskToDelete)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    const snapshot = new Map(
      taskItems.map((task) => [task.id, task.completedPomodoros]),
    )

    if (!hasCompletionSnapshotRef.current) {
      completionSnapshotRef.current = snapshot
      hasCompletionSnapshotRef.current = true
      return
    }

    let newlyCompletedTask = null

    for (const task of taskItems) {
      const previousCompleted = completionSnapshotRef.current.get(task.id)
      const previousValue = previousCompleted ?? task.completedPomodoros
      const wasIncomplete = previousValue < task.estimatedPomodoros
      const isNowComplete = task.completedPomodoros >= task.estimatedPomodoros

      if (wasIncomplete && isNowComplete) {
        newlyCompletedTask = task
        break
      }
    }

    completionSnapshotRef.current = snapshot

    if (newlyCompletedTask) {
      setCompletedTaskPrompt({
        id: newlyCompletedTask.id,
        name: newlyCompletedTask.name,
      })
    }
  }, [taskItems])

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

  const handleSelectNextTask = () => {
    if (!completedTaskPrompt) {
      return
    }

    const completedTaskIndex = taskItems.findIndex((task) => task.id === completedTaskPrompt.id)
    const nextTask = completedTaskIndex >= 0 ? taskItems[completedTaskIndex + 1] : null

    if (nextTask) {
      onSelectTask?.(nextTask.id)
      setCompletedTaskPrompt(null)
      return
    }

    setLastTaskPrompt({
      id: completedTaskPrompt.id,
      name: completedTaskPrompt.name,
    })
    setCompletedTaskPrompt(null)
  }

  const handleKeepGoing = () => {
    setCompletedTaskPrompt(null)
  }

  const handleCloseLastTaskPrompt = () => {
    setLastTaskPrompt(null)
  }

  const handleDeleteLastTaskPrompt = () => {
    if (!lastTaskPrompt) {
      return
    }

    const taskToDelete = taskItems.find((task) => task.id === lastTaskPrompt.id)
    const fallbackTask = {
      id: lastTaskPrompt.id,
      name: lastTaskPrompt.name,
    }
    setLastTaskPrompt(null)
    deleteTaskById(taskToDelete ?? fallbackTask)
  }

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

    const normalizedEstimatedPomodoros = Math.max(
      1,
      Math.min(100, Number.parseInt(String(estimatedPomodoros), 10) || 1),
    )
    const normalizedCurrentPomodoros = Math.max(
      0,
      Math.min(100, Number.parseInt(String(currentPomodoros), 10) || 0),
    )

    const projectPayload = {
      name: trimmedName,
      estimatedPomodoros: normalizedEstimatedPomodoros,
      actualPomodoros: 0,
      totalTimeSpent: 0,
    }

    try {
      if (editingTaskId !== null) {
        const response = await fetch(`${API_BASE_URL}/api/projects/${editingTaskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...projectPayload,
            actualPomodoros: normalizedCurrentPomodoros,
            totalTimeSpent: normalizedCurrentPomodoros * workDurationMinutes,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update task')
        }

        await response.json()
        setTaskItems((prev) =>
          prev.map((task) =>
            task.id === editingTaskId
              ? {
                  ...task,
                  name: trimmedName,
                  completedPomodoros: normalizedCurrentPomodoros,
                  estimatedPomodoros: normalizedEstimatedPomodoros,
                }
              : task,
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
        onSelectTask?.(createdProject.id)
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
      {completedTaskPrompt && (
        <div className="task-complete-modal" role="dialog" aria-modal="true" aria-label="Task completed">
          <div className="task-complete-modal__backdrop" onClick={handleKeepGoing} />
          <div className="task-complete-modal__content">
            <p className="task-complete-modal__title">Congratulations!</p>
            <p className="task-complete-modal__message">You completed "{completedTaskPrompt.name}".</p>
            <div className="task-complete-modal__actions">
              <button
                type="button"
                className="task-complete-modal__keep-going"
                onClick={handleKeepGoing}
              >
                Keep Going
              </button>
              <button
                type="button"
                className="task-complete-modal__next-task"
                onClick={handleSelectNextTask}
              >
                Next Task
              </button>
            </div>
          </div>
        </div>
      )}

      {lastTaskPrompt && (
        <div className="task-complete-modal" role="dialog" aria-modal="true" aria-label="Last task options">
          <div className="task-complete-modal__backdrop" onClick={handleCloseLastTaskPrompt} />
          <div className="task-complete-modal__content">
            <p className="task-complete-modal__title">That was your last task!</p>
            <p className="task-complete-modal__message">Do you want to delete it?</p>
            <div className="task-complete-modal__actions">
              <button
                type="button"
                className="task-complete-modal__keep-going"
                onClick={handleCloseLastTaskPrompt}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="task-complete-modal__next-task"
                onClick={handleDeleteLastTaskPrompt}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmationTask && (
        <div className="task-delete-modal" role="dialog" aria-modal="true" aria-label="Delete task confirmation">
          <div className="task-delete-modal__backdrop" onClick={() => setDeleteConfirmationTask(null)} />
          <div className="task-delete-modal__content">
            <p className="task-delete-modal__title">Delete "{deleteConfirmationTask.name}"?</p>
            
            <div className="task-delete-modal__actions">
              <button
                type="button"
                className="task-delete-modal__cancel"
                onClick={() => setDeleteConfirmationTask(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="task-delete-modal__confirm"
                onClick={confirmDeleteTask}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
      {errorMessage && (
        <p className="task-card__error" role="alert">{errorMessage}</p>
      )}

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
          <div className="task-form__estimated-pomodoros-row">
            <p className="task-form__estimated-pomodoros">Estimated Pomodoros</p>
            <button
              type="button"
              className="task-form__help-button"
              aria-label="What is a pomodoro?"
            >
              ?
              <span className="task-form__help-tooltip" role="tooltip">
                A pomodoro is one focused work block, usually 25 minutes.
              </span>
            </button>
          </div>

          {editingTaskId !== null ? (
            <div className="task-form__pomodoro-split" aria-label="Current and estimated pomodoros">
              <input
                type="number"
                min="0"
                max="100"
                className="task-form__number-input"
                value={currentPomodoros}
                onChange={handleCurrentPomodoroInput}
                onFocus={(event) => event.target.select()}
                aria-label="Current pomodoros"
              />
              <span className="task-form__pomodoro-slash" aria-hidden="true">/</span>
              <input
                type="number"
                min="1"
                max="100"
                className="task-form__number-input"
                value={estimatedPomodoros}
                onChange={handlePomodoroInput}
                onFocus={(event) => event.target.select()}
                aria-label="Estimated pomodoros"
              />
            </div>
          ) : (
            <div className="task-form__pomodoro-row">
              <input
                type="number"
                min="1"
                max="100"
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
          )}

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
                  <img src={trashIcon} alt="" className="task-form__delete-icon" aria-hidden="true" />
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
          {isLoading && (
            <p className="task-card__status">Loading tasks...</p>
          )}

          {/* Render saved tasks only when at least one exists. */}
          {!isLoading && taskItems.length > 0 && (
            <div className="task-list" aria-label="Task list">
              {/* Each row shows task name on the left and progress on the right. */}
              {taskItems.map((task) => (
                <article
                  key={task.id}
                  className={`task-list__item${selectedTaskId === task.id ? ' task-list__item--selected' : ''}`}
                  onClick={() => onSelectTask?.(task.id)}
                >
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
                        onClick={(event) => {
                          event.stopPropagation()
                          handleOpenTaskEdit(task)
                        }}
                      >
                        <span aria-hidden="true" className="task-list__edit-icon">✎</span>
                      </button>
                      <button
                        type="button"
                        className="task-list__delete-button"
                        aria-label={`Delete ${task.name}`}
                        title={`Delete ${task.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDeleteTaskFromList(task)
                        }}
                      >
                        <img src={trashIcon} alt="" className="task-list__delete-icon" aria-hidden="true" />
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