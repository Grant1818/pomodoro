import '../css/task-card.css'

function TaskCard({ title = 'Tasks', buttonLabel = 'Add Task +' }) {
  return (
    <section className="task-card" aria-label="Task card">
      <div className="task-card__header">
        <h1 className="task-card__title">{title}</h1>
        <button
          type="button"
          className="task-card__menu-button"
          aria-label="Open task menu"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
      </div>
      <button type="button" className="task-card__button">{buttonLabel}</button>
    </section>
  )
}

export default TaskCard