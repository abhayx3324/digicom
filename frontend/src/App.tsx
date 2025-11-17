import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ComplaintsList from './pages/ComplaintsList'
import ComplaintDetail from './pages/ComplaintDetail'
import ComplaintForm from './pages/ComplaintForm'
import ProtectedRoute from './components/ProtectedRoute'


export default function App(){
  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container mx-auto p-6">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/complaints" element={<ProtectedRoute><ComplaintsList /></ProtectedRoute>} />
          <Route path="/complaints/create" element={<ProtectedRoute><ComplaintForm /></ProtectedRoute>} />
          <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  )
}