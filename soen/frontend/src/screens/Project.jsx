import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webcontainer'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MessageSquare,
    Code,
    Play,
    Users,
    Plus,
    X,
    Send,
    FileCode,
    Loader2,
    Settings,
    Layout,
    BarChart2,
    Clock,
    Globe,
    ChevronRight,
    ChevronDown,
    RotateCcw,
    Minus,
    Shield,
    Check,
    Trash2,
    Sun,
    Moon
} from 'lucide-react'
import clsx from 'clsx'
import 'highlight.js/styles/github-dark.css' // Ensure dark theme for code

function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    return <code {...props} ref={ref} />
}

const Project = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)


    // Safety check for location.state
    if (!location.state || !location.state.project) {
        // Return null or loader during redirect to avoid crash
        // We will use useEffect to redirect
    }

    const [selectedUserId, setSelectedUserId] = useState(new Set())
    // Use optional chaining or default to avoid initial crash, though effect will redirect
    const [project, setProject] = useState(location.state?.project || {})
    const [message, setMessage] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = React.createRef()

    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})

    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])

    const [terminalOutput, setTerminalOutput] = useState([]) // New state for terminal output
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
    const [projectStats, setProjectStats] = useState({})
    // Terminal resizing state
    const [terminalHeight, setTerminalHeight] = useState(250) // Default height
    const [isPrettyPrint, setIsPrettyPrint] = useState(true) // Default to true for cleaner output
    const isDragging = useRef(false)
    const terminalRef = useRef(null)

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging.current) return
            const newHeight = window.innerHeight - e.clientY
            if (newHeight > 50 && newHeight < window.innerHeight - 100) {
                setTerminalHeight(newHeight)
            }
        }
        const handleMouseUp = () => {
            isDragging.current = false
            document.body.style.cursor = 'default'
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' }) // type: 'info', 'error', 'success'

    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
    }

    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)
    const [runProcess, setRunProcess] = useState(null)

    const [isRunning, setIsRunning] = useState(false)
    const [runStatus, setRunStatus] = useState(null) // "mounting", "installing", "starting"
    const [activeUsers, setActiveUsers] = useState({}) // { userId: { email, currentFile } }
    const [isAiThinking, setIsAiThinking] = useState(false) // Visual indicator for AI processing

    // Handle user selection for collaborators
    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    }

    function addCollaborators() {
        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)
            setProject(res.data.project) // Update project state to show new users immediately
            showToast("Collaborators added successfully!", "success")
        }).catch(err => {
            console.log(err)
            showToast("Failed to add collaborators", "error")
        })
    }

    // THEME SWITCHER
    const [isDarkMode, setIsDarkMode] = useState(true);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    }

    const themeClasses = {
        main: isDarkMode ? "bg-slate-900 text-white" : "bg-gray-100 text-slate-800",
        panel: isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200",
        secondaryPanel: isDarkMode ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200",
        header: isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200 shadow-sm",
        textPrimary: isDarkMode ? "text-white" : "text-slate-900",
        textSecondary: isDarkMode ? "text-slate-400" : "text-slate-500",
        border: isDarkMode ? "border-slate-700" : "border-gray-200",
        hover: isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-100",
        chatBubbleMy: isDarkMode ? "bg-slate-800 text-white" : "bg-white border border-gray-200 shadow-sm text-slate-800",
        chatBubbleOther: isDarkMode ? "bg-slate-800 text-white" : "bg-white border border-gray-200 shadow-sm text-slate-800",
        input: isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300 text-slate-900 shadow-inner",
        codeEditorConfig: isDarkMode ? "vs-dark" : "light"
    };

    function removeUser(userId) {
        if (!confirm("Are you sure you want to remove this user?")) return;

        axios.put("/projects/remove-user", {
            projectId: location.state.project._id,
            userId: userId
        }).then(res => {
            console.log(res.data)
            setProject(res.data.project)
            showToast("User removed successfully", "success")
        }).catch(err => {
            console.log(err)
            showToast("Failed to remove user: " + (err.response?.data?.error || err.message), "error")
        })
    }

    function approveUser(userId, userEmail) {
        axios.put("/users/approve", {
            userId: userId
        }).then(res => {
            alert(`User ${userEmail} allowed to login now.`);
            // Note: Project users list might not auto-update unless we re-fetch, but typically inactive users shouldn't be in project list? 
            // Wait, "allUsers" fetch in useEffect gets ALL users, so we can see them.
            // Let's trigger a re-fetch of all users for the modal logic using "users" state, 
            // but the side panel uses "project.users". 
            // The side panel shows COLLABORATORS (already in project). 
            // Pending users are likely not collaborators yet.
            // Administrator wants "members give them access".
            // So we need a list of ALL users to approve them?
            // "Select User" modal uses `users` state. Let's add approval logic there too or instead.
            // For fast implementation, I'll add approval button to "Collaborators" (if they managed to get in) AND "Select User" list if needed.
            // But wait, if they can't login, they can't accept invites?
            // "Give them access" -> Approve their account.
            // I'll add the function here.
        }).catch(err => {
            console.log(err)
            alert("Failed to approve user: " + (err.response?.data?.error || err.message))
        })
    }

    function promoteUser(userId) {
        if (!confirm("Are you sure you want to promote this user to Administrator? They will have full access.")) return;

        axios.put("/users/promote", {
            userId: userId
        }).then(res => {
            alert(res.data.message);
            // Optional: refresh user list or update local state if needed
        }).catch(err => {
            console.log(err)
            alert("Failed to promote user: " + (err.response?.data?.error || err.message))
        })
    }

    const send = () => {
        if (!message.trim()) return

        if (message.includes('@ai')) {
            setIsAiThinking(true)
        }

        const timestamp = new Date().toISOString()

        sendMessage('project-message', {
            message,
            sender: user,
            timestamp
        })
        setMessages(prevMessages => [...prevMessages, { sender: user, message, timestamp }])
        setMessage("")
    }

    function WriteAiMessage(message) {
        // Clean markdown code blocks if present
        const cleanMessage = message.replace(/```json\n?|```/g, '').trim();
        let messageObject;
        try {
            messageObject = JSON.parse(cleanMessage);
        } catch (e) {
            console.error("Failed to parse AI message:", e);
            messageObject = { text: cleanMessage }; // Fallback to raw text
        }
        return (
            <div className='overflow-auto bg-slate-900/50 rounded-lg p-4 border border-slate-800 text-slate-100 shadow-sm'>
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
    }

    useEffect(() => {
        if (!location.state || !location.state.project) {
            navigate('/')
            return
        }
        initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer()
                .then(container => {
                    setWebContainer(container)
                    console.log("WebContainer started successfully")
                })
                .catch(err => {
                    console.error("Failed to boot WebContainer:", err)
                    alert("Failed to initialize WebContainer. Check console for details.")
                })
        }

        receiveMessage('project-message', data => {
            console.log(data)

            if (data.sender._id == 'ai') {
                setIsAiThinking(false)
                try {
                    const cleanMessage = data.message.replace(/```json\n?|```/g, '').trim();
                    const message = JSON.parse(cleanMessage)
                    if (message.fileTree) {
                        webContainer?.mount(message.fileTree)
                        setFileTree(message.fileTree || {}) // This redundant check is fine or simplify
                    }
                    // Update data with clean message so it renders correctly if passed down raw

                    setMessages(prevMessages => [...prevMessages, { ...data, message: cleanMessage }]) // Store CLEAN message? Or keep raw?
                    // Better to store raw in DB usually, but for UI display we just fixed WriteAiMessage.
                    // However, if we store the 'clean' message here in state, WriteAiMessage will receive clean JSON string
                    // which is still a string and will need parsing again.
                    // Wait, WriteAiMessage calls JSON.parse(message). 
                    // If we save the JSON object in state, WriteAiMessage will choke if it expects a string.
                    // Let's keep it as string but CLEANED string.

                } catch (e) {
                    console.error("Failed to parse AI message:", e)
                    // Still show message even if it failed specific JSON checks, just in case it was a plain text error
                    // But wait, WriteAiMessage will also error. 
                    // We should probably rely on WriteAiMessage's new safety there.
                    setMessages(prevMessages => [...prevMessages, data])
                }
            } else {
                setMessages(prevMessages => [...prevMessages, data])
            }
        })

        receiveMessage('project-activity', data => {
            // data = { userId, email, field: 'file', value: 'filename' }
            setActiveUsers(prev => ({
                ...prev,
                [data.userId]: {
                    ...prev[data.userId],
                    email: data.email,
                    [data.field]: data.value
                }
            }))
        })

        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        })

        axios.get(`/projects/get-messages/${location.state.project._id}`).then(res => {
            setMessages(res.data.messages)
        }).catch(err => {
            console.log(err)
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => {
            console.log(err)
        })
    }, [])

    // Persistence: Restore state
    useEffect(() => {
        if (!project?._id) return;
        const savedOpenFiles = localStorage.getItem(`openFiles_${project._id}`);
        const savedCurrentFile = localStorage.getItem(`currentFile_${project._id}`);
        if (savedOpenFiles) {
            setOpenFiles(JSON.parse(savedOpenFiles));
        }
        if (savedCurrentFile) {
            setCurrentFile(savedCurrentFile);
        }
    }, [project._id]);

    // Persistence: Save state
    useEffect(() => {
        if (!project?._id) return;
        localStorage.setItem(`openFiles_${project._id}`, JSON.stringify(openFiles));
    }, [openFiles, project._id]);

    useEffect(() => {
        if (!project?._id) return;
        if (currentFile) {
            localStorage.setItem(`currentFile_${project._id}`, currentFile);
        }
    }, [currentFile, project._id]);


    function fetchStats() {
        axios.get(`/projects/get-stats/${project._id}`).then(res => {
            setProjectStats(res.data.stats)
            setIsStatsModalOpen(true)
        }).catch(err => {
            console.log(err)
        })
    }

    // Auto-scroll chat
    useEffect(() => {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight
        }
    }, [messages, isAiThinking])


    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }

    function stripAnsi(str) {
        if (!str || typeof str !== 'string') return ''
        return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
            .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Remove control chars (except \n)
    }

    async function handleRun() {
        if (!webContainer) {
            console.warn("Run clicked but WebContainer is null")
            alert("WebContainer is booting... please wait.")
            return
        }

        console.log("Starting run process...")
        setTerminalOutput([]) // Clear previous output for clean run

        // Debug: Check fileTree
        if (!fileTree || typeof fileTree !== 'object') {
            setTerminalOutput(["Error: Invalid file tree structure."]);
            return;
        }

        const fileCount = Object.keys(fileTree).length;
        if (fileCount === 0) {
            setTerminalOutput(["Error: No files found to run."]);
            return;
        }

        setIsRunning(true)
        setRunStatus("mounting")
        try {
            await webContainer.mount(fileTree)

            const packageJson = fileTree['package.json']
            if (packageJson) {
                setRunStatus("installing")
                // Only show installing message, hide stream unless error
                setTerminalOutput(prev => [...prev, "Installing dependencies..."])

                const installProcess = await webContainer.spawn("npm", ["install"])

                // We can mute the install output or filter it aggressively
                installProcess.output.pipeTo(new WritableStream({
                    write(chunk) {
                        // Optional: Only log errors or warnings?
                        // For now we keep it but maybe we can suppress the spinner chars
                    }
                }))

                if (await installProcess.exit !== 0) {
                    setTerminalOutput(prev => [...prev, "Installation failed."])
                    throw new Error("Installation failed");
                }
                setTerminalOutput(prev => [...prev, "Installation complete.", ""])
            } else {
                setTerminalOutput(prev => [...prev, "No package.json, skipping install.", ""])
            }

            setRunStatus("starting")
            setTerminalOutput(prev => [...prev, "Starting server..."])

            if (runProcess) {
                runProcess.kill()
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            let tempRunProcess = await webContainer.spawn("npm", ["start"]);

            tempRunProcess.output.pipeTo(new WritableStream({
                write(chunk) {
                    const str = chunk.toString();
                    const cleanStr = stripAnsi(str);
                    if (cleanStr.trim()) {
                        setTerminalOutput(prev => [...prev, cleanStr])
                    }
                }
            }))

            setRunProcess(tempRunProcess)

            // CRITICAL FIX: Listen for exit
            tempRunProcess.exit.then((code) => {
                console.log("Process exited with code", code);
                setTerminalOutput(prev => [...prev, `\nProcess exited with code ${code}`])
                setIsRunning(false);
                setRunStatus(null);
            })

            webContainer.on('server-ready', (port, url) => {
                console.log(port, url)
                setTerminalOutput(prev => [...prev, `\nServer ready at ${url}\n`])
                setIframeUrl(url)
                setIsRunning(false)
                setRunStatus(null)
            })
        } catch (error) {
            console.error(error)
            setTerminalOutput(prev => [...prev, `\nError: ${error.message}\n`])
            alert("Failed to run: " + error.message)
            setIsRunning(false)
            setRunStatus(null)
        }
    }

    return (
        <main className='h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden font-sans'>
            {/* LEFT SIDEBAR - CHAT */}
            <section className="left flex flex-col h-full w-[380px] bg-slate-900 border-r border-slate-800 relative shadow-xl z-20">

                {/* Header */}
                <header className='glass-header h-16 flex justify-between items-center px-6 shrink-0 z-30'>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                <Code className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:text-white transition-colors">Dev_Fusion</h1>
                        </button>
                    </div>
                    <button
                        onClick={fetchStats}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="View Stats"
                    >
                        <BarChart2 className="w-5 h-5" />
                    </button>
                    {user.isAdmin && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Add Collaborator"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                </header>

                {/* Chat Area */}
                {/* Chat Area */}
                <div className={clsx("conversation-area flex-grow flex flex-col relative overflow-hidden", isDarkMode ? "bg-slate-950/30" : "bg-gray-50/50")}>
                    <div
                        ref={messageBox}
                        className="message-box flex-grow flex flex-col gap-4 p-6 overflow-auto"
                    >
                        {messages.map((msg, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={index}
                                className={clsx(
                                    "flex flex-col max-w-[85%]", // 85% width for better chat feel
                                    msg.sender._id == user._id.toString() ? "self-end items-end" : "self-start items-start"
                                )}
                            >
                                <div className="flex items-baseline gap-2 mb-1 px-1 opacity-70">
                                    <span className="text-xs font-medium opacity-75">
                                        {msg.sender.email.split('@')[0]}
                                    </span>
                                    {msg.timestamp && (
                                        <span className={clsx("text-[10px]", themeClasses.textSecondary)}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <div className={clsx(
                                    "p-3 rounded-2xl shadow-sm text-sm leading-relaxed border my-1",
                                    msg.sender._id == user._id.toString()
                                        ? "bg-blue-600 text-white border-blue-500 rounded-tr-sm"
                                        : themeClasses.chatBubbleOther + " rounded-tl-sm",
                                    msg.sender._id === 'ai' && "w-full max-w-full !p-0 !bg-transparent !border-none !shadow-none" // AI message handles its own styles
                                )}>
                                    {msg.sender._id === 'ai' ? (
                                        WriteAiMessage(msg.message)
                                    ) : (
                                        <p>{msg.message}</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {isAiThinking && (
                            <div className="flex flex-col max-w-[85%] self-start items-start">
                                <span className={clsx("text-xs mb-1 px-1", themeClasses.textSecondary)}>AI</span>
                                <div className={clsx("p-3 rounded-2xl rounded-tl-sm border flex items-center gap-2 italic text-sm", themeClasses.secondaryPanel, themeClasses.textSecondary)}>
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    <span>Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className={clsx("inputField flex items-center p-4 border-t gap-3", themeClasses.panel, themeClasses.border)}>
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && send()}
                            className={clsx('flex-grow rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm', themeClasses.input)}
                            type="text"
                            placeholder='Ask AI to edit code...'
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={send}
                            className='w-11 h-11 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors'
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </motion.button>
                    </div>
                </div>

                {/* Side Panel (Collaborators) */}
                <AnimatePresence>
                    {isSidePanelOpen && (
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            className={clsx("absolute inset-0 z-50 flex flex-col", themeClasses.panel)}
                        >
                            <header className={clsx('flex justify-between items-center px-6 py-4 border-b', themeClasses.border, isDarkMode ? "border-slate-800" : "")}>
                                <h1 className='font-semibold text-lg'>Collaborators</h1>
                                <button onClick={() => setIsSidePanelOpen(false)} className='p-2 hover:bg-slate-800 rounded-lg'>
                                    <X className="w-5 h-5" />
                                </button>
                            </header>
                            <div className="flex-col gap-2 p-4">
                                {project.users && project.users.map(u => (
                                    <div className={clsx("user cursor-pointer p-3 rounded-lg flex gap-3 items-center transition-colors", themeClasses.hover)}>
                                        <div className='w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300'>
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <span className='font-medium'>{u.email}</span>
                                        {user.isAdmin && !u.isApproved && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    approveUser(u._id, u.email);
                                                }}
                                                className="ml-auto p-1.5 hover:bg-yellow-500/20 text-yellow-500 hover:text-yellow-400 rounded-md transition-colors"
                                                title="Approve User Pending Login"
                                            >
                                                <div className="w-4 h-4 font-bold flex items-center justify-center">?</div>
                                            </button>
                                        )}
                                        {user.isAdmin && u.isApproved && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent row click
                                                    removeUser(u._id);
                                                }}
                                                className="ml-auto p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* RIGHT MAIN AREA */}
            <section className="right flex-grow h-full flex flex-col bg-slate-950 relative overflow-hidden">

                {/* EXPLORER & EDITOR */}
                <div className="flex flex-grow h-full overflow-hidden">

                    {/* File Explorer */}
                    <div className="explorer h-full w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
                        <div className="p-4 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Files
                        </div>
                        <div className="file-tree flex-grow overflow-auto p-2">
                            {Object.keys(fileTree).map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setCurrentFile(file)
                                        setOpenFiles([...new Set([...openFiles, file])])
                                        // Emit activity
                                        sendMessage('project-activity', {
                                            userId: user._id,
                                            email: user.email,
                                            field: 'file',
                                            value: file
                                        })
                                    }}
                                    className={clsx(
                                        "w-full text-left p-2 px-3 rounded-lg flex items-center gap-2 mb-1 transition-all",
                                        currentFile === file ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                                    )}>
                                    <FileCode className="w-4 h-4 opacity-70" />
                                    <span className='text-sm truncate'>{file}</span>
                                    {/* Active Users Avatars */}
                                    <div className="flex -space-x-2 ml-auto">
                                        {Object.values(activeUsers)
                                            .filter(u => u.file === file && u.email !== user.email) // Don't show self
                                            .map((u, i) => (
                                                <div
                                                    key={i}
                                                    className="w-5 h-5 rounded-full bg-blue-600 border border-slate-900 flex items-center justify-center text-[8px] text-white font-bold"
                                                    title={u.email}
                                                >
                                                    {u.email[0].toUpperCase()}
                                                </div>
                                            ))
                                        }
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="code-editor flex flex-col flex-grow h-full bg-slate-900 overflow-hidden relative">

                        {/* Editor Tabs & Actions */}
                        <div className="top flex justify-between items-center h-14 bg-slate-950 border-b border-slate-800 px-2">
                            <div className="files flex gap-1 overflow-x-auto scrollbar-hide max-w-[70%]">
                                {openFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                                        className={clsx(
                                            "cursor-pointer px-4 py-2 flex items-center gap-2 rounded-t-lg text-sm border-t border-x transition-colors min-w-fit",
                                            currentFile === file
                                                ? "bg-slate-900 border-slate-800 text-white border-b-slate-900"
                                                : "bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
                                        )}>
                                        <span>{file}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Ask AI Button - Only visible when text is selected (simulated here as always visible for access, checks selection on click) */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    const selection = window.getSelection().toString();
                                    if (!selection) {
                                        showToast("Please select some code to explain first.", "error");
                                        return;
                                    }
                                    const prompt = `@ai Explain this code:\n\`\`\`javascript\n${selection}\n\`\`\``;
                                    sendMessage('project-message', {
                                        message: prompt,
                                        sender: user
                                    });
                                    setMessages(prev => [...prev, { sender: user, message: prompt }]);
                                }}
                                className="mr-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-lg shadow-purple-500/20"
                            >
                                <MessageSquare className="w-3 h-3" />
                                Ask AI
                            </motion.button>

                            {/* Run Button Enhancement */}
                            <div className="actions flex items-center gap-4 px-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleRun}
                                    disabled={isRunning || !webContainer}
                                    className={clsx(
                                        "px-6 py-2 rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg transition-all",
                                        (isRunning || !webContainer)
                                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/40"
                                    )}
                                >
                                    {!webContainer ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Booting...
                                        </>
                                    ) : isRunning ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {runStatus === 'mounting' ? 'Mounting...' :
                                                runStatus === 'installing' ? 'Installing...' :
                                                    runStatus === 'starting' ? 'Starting...' : 'Loading...'}
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 fill-current" />
                                            Run
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>

                        {/* Editor Interaction */}
                        <div className="bottom flex flex-grow overflow-hidden relative">
                            {fileTree[currentFile] ? (
                                <div className="code-editor-area w-full h-full overflow-auto bg-[#0d1117] text-sm custom-scrollbar">
                                    <pre className="hljs h-full !bg-transparent !p-4 !font-mono">
                                        <code
                                            className="hljs outline-none !bg-transparent"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [currentFile]: {
                                                        file: {
                                                            contents: updatedContent
                                                        }
                                                    }
                                                }
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }}
                                            dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[currentFile].file.contents).value }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                display: 'block',
                                                fontFamily: '"Fira Code", monospace'
                                            }}
                                        />
                                    </pre>
                                </div>
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-600 flex-col gap-4">
                                    <Layout className="w-16 h-16 opacity-20" />
                                    <p>Select a file to edit</p>
                                </div>
                            )}
                        </div>


                        {/* TERMINAL AREA - RESIZABLE */}
                        <div
                            className="terminal flex flex-col bg-[#1e1e1e] border-t border-slate-800 transition-all ease-out"
                            style={{ height: `${terminalHeight}px` }}
                        >
                            {/* Resize Handle */}
                            <div
                                className="resize-handle h-1 bg-slate-700 hover:bg-blue-500 cursor-row-resize transition-colors opacity-50 hover:opacity-100"
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    isDragging.current = true
                                    document.body.style.cursor = 'row-resize'
                                }}
                            />

                            <div className="flex justify-between items-center px-4 py-2 bg-[#1e1e1e] border-b border-slate-700/50 select-none">
                                <div className="flex items-center gap-2">
                                    <div className="text-slate-400">
                                        <span className="font-bold text-xs uppercase tracking-wider">Terminal</span>
                                    </div>
                                    <div className="ml-4 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="pretty-print"
                                            checked={isPrettyPrint}
                                            onChange={(e) => setIsPrettyPrint(e.target.checked)}
                                            className="w-3 h-3 accent-blue-600 rounded cursor-pointer"
                                        />
                                        <label htmlFor="pretty-print" className="text-xs text-slate-400 cursor-pointer select-none">Pretty-print</label>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setTerminalOutput([])}
                                    className="text-slate-500 hover:text-red-400 text-xs transition-colors flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" />
                                    Clear
                                </button>
                            </div>
                            <div className="flex-grow overflow-auto p-3 font-mono text-xs text-slate-300 custom-scrollbar">
                                <pre className="whitespace-pre-wrap font-[Consolas,Monaco,'Courier New',monospace]">
                                    {terminalOutput.length === 0 && <span className="text-slate-600 italic select-none">Ready to run...</span>}
                                    {terminalOutput.map((line, i) => {
                                        let displayLine = line;
                                        if (isPrettyPrint) {
                                            try {
                                                const jsonMatch = line.match(/\{.*\}/);
                                                if (jsonMatch) {
                                                    const json = JSON.parse(jsonMatch[0]);
                                                    displayLine = json.message ? `> ${json.message}` : JSON.stringify(json, null, 2);
                                                }
                                            } catch (e) {
                                                // Invalid JSON, keep original
                                            }
                                        }
                                        return (
                                            <div key={i} className="leading-snug hover:bg-white/5 px-1 rounded transition-colors break-words">
                                                {displayLine}
                                            </div>
                                        )
                                    })}
                                    {/* Auto-scroll anchor if needed, but flex-grow usually handles it */}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Preview / Browser URL */}
                    {/* Preview / Browser URL */}
                    {iframeUrl && webContainer && (
                        <div className="flex flex-col w-96 border-l border-slate-800 bg-slate-950 shrink-0">
                            <div className="address-bar p-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
                                <div className="flex items-center gap-1 text-slate-500">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                                </div>
                                <div className="flex-grow flex items-center bg-slate-800 rounded-lg px-2 py-1 border border-slate-700">
                                    <Globe className="w-3 h-3 text-slate-500 mr-2" />
                                    <input
                                        type="text"
                                        onChange={(e) => setIframeUrl(e.target.value)}
                                        value={iframeUrl}
                                        className="w-full text-xs bg-transparent text-slate-300 outline-none font-mono tracking-wide"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const iframe = document.querySelector('iframe');
                                        if (iframe) iframe.src = iframeUrl
                                    }}
                                    className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 transition-colors"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <iframe
                                src={iframeUrl}
                                // Keep bg-white for the iframe content itself as most web apps assume white base
                                sandbox="allow-scripts allow-forms allow-same-origin"
                                title="Project Preview"
                                className="w-full h-full flex-grow border-none bg-white"
                            ></iframe>
                        </div>
                    )}

                </div>
            </section>

            {/* Modal for Member Management (Strict Flow) */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <header className="px-6 py-4 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center shrink-0">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <Shield className="w-5 h-5 text-blue-500" /> Team Management
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </header>

                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                {/* SECTION 1: ADD MEMBER (Confidential Credentials) */}
                                {user.isAdmin && (
                                    <div className="mb-8 p-4 bg-slate-800/30 rounded-xl border border-blue-500/20">
                                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Plus className="w-4 h-4" /> Step 1: Create Member
                                        </h3>
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                const email = e.target.email.value;
                                                const password = e.target.password.value;

                                                axios.post('/projects/invite-member', {
                                                    projectId: project._id,
                                                    email,
                                                    password
                                                }).then(res => {
                                                    alert("Member created successfully! They can now login.");
                                                    e.target.reset();
                                                    // Refresh project data
                                                    axios.get(`/projects/get-project/${project._id}`).then(r => setProject(r.data.project));
                                                }).catch(err => {
                                                    alert(err.response?.data?.error || "Failed to create user");
                                                });
                                            }}
                                            className="space-y-3"
                                        >
                                            <div>
                                                <label className="text-xs text-slate-500 font-medium ml-1">Gmail Address</label>
                                                <input
                                                    name="email"
                                                    type="email"
                                                    placeholder="member@gmail.com"
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-medium ml-1">Assign Password</label>
                                                <input
                                                    name="password"
                                                    type="text"
                                                    placeholder="set-password-123"
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/20 mt-2"
                                            >
                                                Create & Invite Member
                                            </button>
                                        </form>
                                        <p className="text-[10px] text-slate-500 mt-3 text-center">
                                            * User will be created with <span className="text-amber-400">PENDING</span> status until you approve them below.
                                        </p>
                                    </div>
                                )}

                                {/* SECTION 2: PENDING REQUESTS */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Step 2: Pending Requests
                                    </h3>

                                    {(!project.pendingUsers || project.pendingUsers.length === 0) ? (
                                        <div className="text-center py-6 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                                            <p className="text-slate-500 text-sm">No pending join requests.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {project.pendingUsers.map(u => (
                                                <div key={u._id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs">
                                                            {u.email?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-slate-200">{u.email || 'Unknown'}</span>
                                                            <span className="text-[10px] text-amber-500 font-mono uppercase">Requesting Join</span>
                                                        </div>
                                                    </div>
                                                    {user.isAdmin && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    axios.put('/projects/approve-request', {
                                                                        projectId: project._id,
                                                                        userId: u._id,
                                                                        action: 'reject'
                                                                    }).then(res => setProject(res.data.project))
                                                                        .catch(err => alert(err.message));
                                                                }}
                                                                className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded bg-slate-900 border border-slate-700 transition-colors"
                                                                title="Reject"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    axios.put('/projects/approve-request', {
                                                                        projectId: project._id,
                                                                        userId: u._id,
                                                                        action: 'accept'
                                                                    }).then(res => setProject(res.data.project))
                                                                        .catch(err => alert(err.message));
                                                                }}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow-lg shadow-emerald-900/20 transition-colors flex items-center gap-1"
                                                            >
                                                                <Check className="w-3 h-3" /> Accept
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* SECTION 3: CURRENT TEAM */}
                                <div>
                                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Current Team
                                    </h3>
                                    <div className="space-y-2">
                                        {project.users.map(u => (
                                            <div key={u._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition-colors bg-slate-900 border border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs ring-1 ring-emerald-500/20">
                                                        {u.email[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-slate-300">{u.email}</span>
                                                    </div>
                                                </div>
                                                {user.isAdmin && project.owner !== u._id && (
                                                    <button
                                                        onClick={() => removeUser(u._id)}
                                                        className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded transition-colors"
                                                        title="Remove Member"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Modal for Stats */}
            <AnimatePresence>
                {isStatsModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-[500px] shadow-2xl relative"
                        >
                            <header className='flex justify-between items-center mb-6'>
                                <h2 className='text-xl font-bold text-white flex items-center gap-2'>
                                    <BarChart2 className="w-5 h-5 text-blue-500" />
                                    Project Usage Stats
                                </h2>
                                <button onClick={() => setIsStatsModalOpen(false)} className='p-2 hover:bg-slate-800 rounded-full transition-colors'>
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </header>

                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-3 gap-4 border-b border-slate-800 pb-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                    <span>User</span>
                                    <span className="text-center">Logins</span>
                                    <span className="text-right">Total Time</span>
                                </div>
                                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                                    {Object.entries(projectStats).map(([email, data]) => (
                                        <div key={email} className="grid grid-cols-3 gap-4 items-center p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                                                    {email[0].toUpperCase()}
                                                </div>
                                                <span className="truncate text-slate-200 text-sm">{email}</span>
                                            </div>
                                            <div className="text-center text-slate-300 font-mono">
                                                {data.logins}
                                            </div>
                                            <div className="text-right text-blue-400 font-mono flex items-center justify-end gap-1">
                                                <Clock className="w-3 h-3" />
                                                {Math.floor(data.totalDuration / 60)}m {data.totalDuration % 60}s
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(projectStats).length === 0 && (
                                        <div className="text-center text-slate-500 py-4">No validation data available yet.</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* TOAST NOTIFICATION */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={clsx(
                            "absolute top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-3 border backdrop-blur-md",
                            toast.type === 'error' ? "bg-red-500/10 border-red-500/20 text-red-200" :
                                toast.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-200" :
                                    "bg-blue-500/10 border-blue-500/20 text-blue-200"
                        )}
                    >
                        {toast.type === 'error' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                        {toast.type === 'success' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                        {toast.type === 'info' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        <span className="font-medium text-sm">{toast.message}</span>
                        <button
                            onClick={() => setToast(prev => ({ ...prev, show: false }))}
                            className="ml-2 hover:opacity-70"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </main >
    )
}

export default Project