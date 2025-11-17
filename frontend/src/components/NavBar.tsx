import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'


    const NavBar: React.FC = () => {
    const { user, logout } = useAuth()
    const nav = useNavigate()
    return (
        <div className="w-full py-4 px-6 flex items-center justify-between bg-transparent">
            <div className="flex items-center gap-4">
                <div className="text-2xl font-extrabold text-netflixRed">MyApp</div>
                <Link to="/" className="text-sm opacity-70">Home</Link>
                <Link to="/complaints" className="text-sm opacity-70">Complaints</Link>
                </div>
                <div>
                {user ? (
                    <div className="flex items-center gap-3">
                        <span className="text-sm opacity-80">{user.email}</span>
                        <button className="px-3 py-1 rounded-md border border-gray-700" onClick={() => { logout(); nav('/login') }}>Logout</button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Link to="/login" className="px-3 py-1 rounded-md border border-gray-700">Login</Link>
                        <Link to="/register" className="px-3 py-1 rounded-md border border-gray-700">Register</Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default NavBar;