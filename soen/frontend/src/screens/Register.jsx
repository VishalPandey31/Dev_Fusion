import React from 'react'
import { Link } from 'react-router-dom'

const Register = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Registration Restricted</h2>
                <p className="text-slate-400 mb-6">
                    New user registration is disabled. Only Administrators can add team members.
                </p>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Please contact your System Administrator to request access.
                    </p>
                    <div className="border-t border-slate-700 pt-4 mt-4">
                        <Link to="/login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all">
                            Back to Login
                        </Link>
                        <div className="mt-4">
                            <Link to="/admin-register" className="text-slate-500 text-xs hover:text-slate-300">
                                Administrator Registration
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register