
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Room from './pages/room'
import Auth from './pages/auth'
import JoinRoom from './pages/joinroom'
import CreateRoom from './pages/createroom'
import Home from './pages/home'

function App() {

  return (
    <>
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/auth' element={<Auth />}></Route>
        <Route path='/join' element={<JoinRoom />}></Route>
        <Route path='/create' element={<CreateRoom />}></Route>
        <Route path='/room/:roomId' element={<Room />}></Route>
      </Routes>
    </>
  )
}

export default App
