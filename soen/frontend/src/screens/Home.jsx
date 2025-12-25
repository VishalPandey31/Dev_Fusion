import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'
import { Plus, Folder, Users, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const Home = () => {
    const { user, setUser } = useContext(UserContext)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [projectName, setProjectName] = useState("")
    const [projects, setProjects] = useState([])
    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()
        if (!projectName.trim()) return

        axios.post('/projects/create', { name: projectName })
            .then((res) => {
                setIsModalOpen(false)
                setProjectName("")
                loadProjects()
            })
            .catch((error) => {
                console.log(error)
                alert(JSON.stringify(error.response?.data) || "Failed to create project")
            })
    }

    function loadProjects() {
        axios.get('/projects/all')
            .then((res) => {
                setProjects(res.data.projects)
            })
            .catch(err => {
                console.log(err)
            })
    }

    function handleLogout() {
        localStorage.removeItem('token')
        setUser(null)
        navigate('/login')
    }

    useEffect(() => {
        loadProjects()
    }, [])

    return (
        <main className='min-h-screen bg-slate-950 text-slate-100 p-8 font-sans'>
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Dashboard
                    </h1>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* New Project Card */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsModalOpen(true)}
                        className="group flex flex-col items-center justify-center p-8 border border-dashed border-slate-700 rounded-2xl bg-slate-900/50 hover:bg-slate-900 hover:border-blue-500/50 transition-all cursor-pointer h-48"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                            <Plus className="w-6 h-6 text-blue-500 group-hover:text-blue-400" />
                        </div>
                        <span className="font-semibold text-slate-400 group-hover:text-slate-200">New Project</span>
                    </motion.button>

                    {/* Project Cards */}
                    {projects.map((project) => (
                        <motion.div
                            key={project._id}
                            whileHover={{ y: -4 }}
                            onClick={() => navigate(`/project`, { state: { project } })}
                            className="glass p-6 rounded-2xl cursor-pointer hover:border-blue-500/30 transition-all flex flex-col justify-between h-48 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <Folder className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            <div>
                                <h2 className='font-bold text-lg mb-2 truncate text-slate-100'>{project.name}</h2>
                                <p className="text-xs text-slate-500">Last updated recently</p>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 w-fit px-3 py-1.5 rounded-full">
                                <Users className="w-3 h-3" />
                                <span>{project.users.length} Collaborators</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Create Modal */}
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                            onClick={() => setIsModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h2 className="text-2xl font-bold text-white mb-6">Create New Project</h2>
                                <form onSubmit={createProject}>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            Project Name
                                        </label>
                                        <input
                                            onChange={(e) => setProjectName(e.target.value)}
                                            value={projectName}
                                            type="text"
                                            autoFocus
                                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-600"
                                            placeholder="Awesome Project"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                            onClick={() => setIsModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                                        >
                                            Create Project
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}

export default Home
