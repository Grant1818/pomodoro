import '../css/home.css'
import TaskCard from '../components/TaskCard'

function Home() 
{
  return (
    <main className="home-page">
      <TaskCard title="Tasks" buttonLabel="Add Task +" />
    </main>
  )
}

export default Home
