import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    function submitHandler(e) {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        axios.post('/users/login', {
            email: email.trim(),
            password
        }).then((res) => {
            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)
            navigate('/')
        }).catch((err) => {
            console.error(err)
            const data = err.response?.data;
            let errorMsg = 'Login failed';

            if (data?.error) errorMsg = data.error;
            else if (data?.errors) {
                if (Array.isArray(data.errors)) errorMsg = data.errors[0]?.msg || JSON.stringify(data.errors);
                else errorMsg = data.errors;
            } else if (data?.message) {
                errorMsg = data.message;
            }

            // Helpful fallback for status codes
            if (err.response?.status === 400 && errorMsg === 'Login failed') {
                errorMsg = "Invalid request. Please check your input.";
            }

            setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
            setIsLoading(false)
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-slate-400">Sign in to continue to your workspace</p>
                </div>

                <form onSubmit={submitHandler}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-400 mb-1.5" htmlFor="email">Email Address</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-400 mb-1.5" htmlFor="password">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 p-2 rounded-lg">{error}</p>}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full p-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                    </motion.button>
                </form>
                <p className="text-slate-500 mt-6 text-center text-sm">
                    Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">Create one</Link>
                </p>
                <div className="mt-4 text-center">
                    <Link to="/admin-login" className="text-xs text-slate-600 hover:text-slate-400 flex items-center justify-center gap-1 transition-colors">
                        <span>Login as Administrator</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}

export default Login