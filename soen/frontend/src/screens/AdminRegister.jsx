import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'

const AdminRegister = () => {
    const [secretCode, setSecretCode] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [adminPin, setAdminPin] = useState('')
    const [file, setFile] = useState(null)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)
    const navigate = useNavigate()

    function submitHandler(e) {
        e.preventDefault()
        setError(null)
        setMessage(null)

        if (adminPin.length !== 8) {
            setError("PIN must be exactly 8 digits")
            return
        }

        const formData = new FormData()
        formData.append('email', email)
        formData.append('password', password)
        formData.append('adminPin', adminPin)
        formData.append('secretCode', secretCode) // New Field
        if (file) {
            formData.append('identityProof', file)
        }

        axios.post('/admin/register', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then((res) => {
            console.log(res.data)
            setMessage(res.data.message)
            // navigate('/admin-login') // Don't navigate immediately, let them see the message
        }).catch((err) => {
            console.log(err.response?.data)
            const errorMsg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || err.message || 'Registration failed';
            setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
        })
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
                <h2 className="text-3xl font-bold text-white mb-2 text-center">Admin Registration</h2>
                <p className="text-slate-400 text-center mb-6 text-sm">Secure Identity Verification Required.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded-lg mb-4 text-sm">
                        {message}
                        <div className='mt-2'>
                            <Link to="/admin-login" className='underline font-bold'>Proceed to Login</Link>
                        </div>
                    </div>
                )}

                {!message && (
                    <form onSubmit={submitHandler} className="flex flex-col gap-4">
                        <div>
                            <label className="text-slate-300 text-sm font-medium mb-1 block">Secret Admin Code</label>
                            <input
                                onChange={(e) => setSecretCode(e.target.value)}
                                type="password"
                                className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Enter specific secret code"
                                required
                            />
                        </div>

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

                        <div className="p-4 border border-dashed border-slate-600 rounded-lg bg-slate-900/50">
                            <label className="text-slate-300 text-sm font-medium mb-2 block uppercase text-xs tracking-wider">Identity Proof (Document)</label>
                            <input
                                onChange={(e) => setFile(e.target.files[0])}
                                type="file"
                                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                required
                            />
                            <p className="text-xs text-slate-500 mt-2">Upload Government ID or Authorization Letter.</p>
                        </div>

                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all mt-2 shadow-lg shadow-blue-600/20">
                            Verify & Register
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center border-t border-slate-700 pt-4">
                    <p className="text-slate-500 text-xs">
                        Already have an account? <Link to="/admin-login" className="text-slate-400 hover:text-white">Admin Login</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AdminRegister
