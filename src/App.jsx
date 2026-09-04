import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import {BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './componets/Login.jsx';
import Registration from './componets/Registration.jsx'
import Dashboard from './componets/Dashboard.jsx'
import AddTask from './componets/AddTask.jsx'
import ProtectedRoute from './componets/ProtectedRoute.jsx'
import NewUser from './componets/NewUser.jsx'
import ResetPassword from './componets/ResetPassword.jsx'
function App() {
  const [count, setCount] = useState(0)

  return (
   <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login/>}/>
       <Route
          path="/dash"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      <Route path="/register" element={<Registration/>}/>
      <Route path="/reset-password" element={<ResetPassword/>}/>
      <Route path="/newUser" element={<NewUser/>}/>
      {/* <Route path="/dash" element={<Dashboard/>}/> */}
       <Route path="/addTask" element={<AddTask/>}/>
    </Routes>
   </BrowserRouter>
  )
}

export default App
