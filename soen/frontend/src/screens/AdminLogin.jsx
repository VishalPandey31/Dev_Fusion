import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'

const AdminLogin = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [adminPin, setAdminPin] = useState('')
    const [error, setError] = useState(null)
    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    function submitHandler(e) {
        e.preventDefault()
        setError(null)

        axios.post('/users/admin-login', {
            email,
            password,
            adminPin
        }).then((res) => {
            console.log(res.data)
            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)
            navigate('/') // Redirect to dashboard
        }).catch((err) => {
            console.log(err);
            if (err.response) {
                // Server responded with a status code outside 2xx
                const data = err.response.data;
                let errorMsg = 'Login failed';
                if (data?.error) errorMsg = data.error;
                else if (data?.errors) {
                    if (Array.isArray(data.errors)) errorMsg = data.errors[0]?.msg || JSON.stringify(data.errors);
                    else errorMsg = data.errors;
                }
                setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
            } else if (err.request) {
                // Request was made but no response received
                console.log(err.request);
                setError('Network Error: Could not connect to server. Ensure Backend is running on Port 3000.');
            } else {
                // Something happened in setting up the request
                setError('Error: ' + err.message);
            }
        })
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
                <h2 className="text-3xl font-bold text-white mb-2 text-center">Admin Access</h2>
                <p className="text-slate-400 text-center mb-6 text-sm">Restricted Area. Authorized Personnel Only.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={submitHandler} className="flex flex-col gap-4">
                    <div>
                        <label className="text-slate-300 text-sm font-medium mb-1 block">Admin Email</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-slate-300 text-sm font-medium mb-1 block">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-slate-300 text-sm font-medium mb-1 block">Security PIN (8 Digits)</label>
                        <input
                            onChange={(e) => setAdminPin(e.target.value)}
                            type="password"
                            maxLength={8}
                            className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none tracking-widest text-center text-lg"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all mt-2 shadow-lg shadow-blue-600/20">
                        Authenticate
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-slate-700 pt-4">
                    <p className="text-slate-400 text-sm">
                        Not an Admin? <Link to="/login" className="text-blue-400 hover:underline">Member Login</Link>
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                        Need to register? <Link to="/admin-register" className="text-slate-400 hover:text-white">Admin Registration</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AdminLogin
