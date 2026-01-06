import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage, removeListener } from '../config/socket'
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
    Moon,
    Search,
    Calendar,
    Filter,
    Download,
    Share2,
    Mail,
    MessageCircle,
    Copy,
    CodeXml,
    Brain,
    Lightbulb,
    CheckCircle,
    Sparkles,
    Save
} from 'lucide-react'
import clsx from 'clsx'
import 'highlight.js/styles/github-dark.css'
import SearchModal from '../components/SearchModal'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'

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

// Memoized AI Message Component - MOVED OUTSIDE Project component
const AiMessage = React.memo(({ message }) => {
    if (typeof message !== 'string') return <p>Invalid message format</p>;

    // Clean markdown code blocks if present
    const cleanMessage = message.replace(/```json\n?|```/g, '').trim();
    let messageObject;
    try {
        messageObject = JSON.parse(cleanMessage);
    } catch (e) {
        // Fallback to raw text
        messageObject = { text: message };
    }

    const textContent = (typeof messageObject.text === 'string') ? messageObject.text : JSON.stringify(messageObject, null, 2);

    return (
        <div className='overflow-auto bg-slate-900/50 rounded-lg p-4 border border-slate-800 text-slate-100 shadow-sm font-mono whitespace-pre-wrap'>
            {textContent}
        </div>
    );
});



function mergeFileTrees(target, source) {
    const output = { ...target };
    if (Object.keys(source).length === 0) return output; // Handle empty source

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (source[key] && typeof source[key] === 'object' && !source[key].file) {
                // It's a directory (or object acting as one), check if it exists in target
                if (target[key] && typeof target[key] === 'object' && !target[key].file) {
                    output[key] = mergeFileTrees(target[key], source[key]);
                } else {
                    output[key] = source[key];
                }
            } else {
                // It's a file or overwriting a non-directory
                output[key] = {
                    ...source[key],
                    lastModified: source[key].lastModified || new Date().toISOString()
                };
            }
        }
    }
    return output;
}

const Project = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)


    // Safety check for location.state
    useEffect(() => {
        if (!location.state || !location.state.project) {
            navigate('/')
        }
    }, [location.state, navigate])

    if (!location.state || !location.state.project) {
        return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Loading...</div>
    }

    const [selectedUserId, setSelectedUserId] = useState(new Set())
    // Use optional chaining or default to avoid initial crash, though effect will redirect
    const [project, setProject] = useState(location.state?.project || {})
    const [message, setMessage] = useState('')
    const { user, setUser } = useContext(UserContext)
    const messageBox = React.createRef()



    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})

    const [currentFile, setCurrentFile] = useState(null)

    // Debug: Ref to track current file for event listeners
    const currentFileRef = useRef(null)
    useEffect(() => {
        currentFileRef.current = currentFile
    }, [currentFile])
    const [openFiles, setOpenFiles] = useState([])

    const [fileFilter, setFileFilter] = useState('all') // 'all', 'today', 'yesterday', 'custom'
    const [filterDate, setFilterDate] = useState('')
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)

    // Derived state for filtered files
    const filteredFiles = Object.keys(fileTree).filter(file => {
        const item = fileTree[file]
        const date = item.lastModified ? new Date(item.lastModified) : null

        if (!date) return fileFilter === 'all'; // Show untimestamped files only in 'all'

        if (fileFilter === 'all') return true;
        if (fileFilter === 'today') return isToday(date);
        if (fileFilter === 'yesterday') return isYesterday(date);
        if (fileFilter === 'custom' && filterDate) return isSameDay(date, new Date(filterDate));

        return true;
    });

    const [terminalOutput, setTerminalOutput] = useState([]) // New state for terminal output
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
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

    // AI Feedback State
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
    const [feedbackData, setFeedbackData] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const [reviewLanguage, setReviewLanguage] = useState('English');
    const [feedbackCache, setFeedbackCache] = useState({}); // Cache for instant toggling

    async function handleAnalyzeCode(overrideLanguage = null) {
        if (!currentFile || !fileTree[currentFile]) {
            showToast("Please open a file to analyze", "error");
            return;
        }

        const code = fileTree[currentFile].file.contents;

        if (!code || code.trim().length === 0) {
            showToast("File is empty", "error");
            return;
        }

        // Language Override Logic
        const isLanguageOverride = typeof overrideLanguage === 'string';
        let langToSend = isLanguageOverride ? overrideLanguage : reviewLanguage;

        if (typeof langToSend !== 'string') {
            langToSend = 'English';
        }

        // 1. If this is a fresh analysis (not a toggle), clear cache
        if (!isLanguageOverride) {
            setFeedbackCache({});
        }

        // 2. Check Cache (Instant Switch)
        if (isLanguageOverride && feedbackCache[langToSend]) {
            setFeedbackData(feedbackCache[langToSend]);
            setReviewLanguage(overrideLanguage);
            return;
        }

        if (isLanguageOverride) setReviewLanguage(overrideLanguage);

        setIsAnalyzing(true);
        try {
            const res = await axios.post('/ai/get-feedback', {
                code,
                language: langToSend
            });
            setFeedbackData(res.data);
            setIsFeedbackModalOpen(true);

            // 3. Update Cache
            setFeedbackCache(prev => ({ ...prev, [langToSend]: res.data }));
        } catch (error) {
            console.error(error);
            showToast("Failed to analyze code", "error");
        } finally {
            setIsAnalyzing(false);
        }
    }

    // --- Feature 2 & 3 State & Logic ---
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [preferences, setPreferences] = useState({ preferredStack: 'React/Node', codeStyle: 'Standard', language: 'English' });

    // Load prefs when opening modal
    useEffect(() => {
        if (isSettingsModalOpen && user) {
            // Ideally we fetch from API, but for now we default or use what's in user object if available
            if (user.preferences) {
                setPreferences(user.preferences);
            }
        }
    }, [isSettingsModalOpen, user]);

    async function handleSavePreferences(e) {
        e.preventDefault();
        try {
            const res = await axios.put('/users/preferences', preferences);
            showToast("Preferences saved!", "success");
            setIsSettingsModalOpen(false);

            // Update User Context to reflect changes immediately
            if (setUser) {
                setUser(prev => ({ ...prev, preferences: res.data.preferences }));
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to save preferences", "error");
        }
    }

    const [isSmartFixOpen, setIsSmartFixOpen] = useState(false);
    const [fixErrorInput, setFixErrorInput] = useState('');
    const [fixResult, setFixResult] = useState(null);
    const [isFixing, setIsFixing] = useState(false);
    const [smartFixLanguage, setSmartFixLanguage] = useState('English');
    const [smartFixCache, setSmartFixCache] = useState({}); // Cache for instant toggling

    function openSmartFix() {
        setSmartFixCache({}); // Clear cache on new open
        // Try to grab last error from terminal
        const text = terminalOutput.join('\n');
        // Simple heuristic: grab last 5 lines if they contain "Error"
        if (text.toLowerCase().includes('error')) {
            const lines = text.split('\n');
            const errorLines = lines.slice(-10).join('\n'); // Last 10 lines
            setFixErrorInput(errorLines);
        } else {
            setFixErrorInput('');
        }
        setFixResult(null);
        setIsSmartFixOpen(true);
    }

    async function handleSmartFix(overrideLanguage = null) {
        if (!fixErrorInput.trim()) return;

        // If called via onClick={handleSmartFix}, overrideLanguage is an Event object. Ignore it.
        const isLanguageOverride = typeof overrideLanguage === 'string';
        let langToSend = isLanguageOverride ? overrideLanguage : smartFixLanguage;

        // CRITICAL SAFETY: Ensure langToSend is a string. If state is corrupted (e.g. holding an Event object), force reset.
        if (typeof langToSend !== 'string') {
            console.warn("Detected corrupted language state. Resetting to English.");
            langToSend = 'English';
        }

        // Check Cache (Instant Switch)
        if (isLanguageOverride) {
            if (smartFixCache[langToSend]) {
                setFixResult(smartFixCache[langToSend]);
                setSmartFixLanguage(overrideLanguage);
                return;
            }
            setSmartFixLanguage(overrideLanguage);
        }

        setIsFixing(true);
        try {
            const res = await axios.post('/ai/fix-error', {
                errorMessage: fixErrorInput,
                language: langToSend
            });
            setFixResult(res.data);
            // Update Cache
            setSmartFixCache(prev => ({ ...prev, [langToSend]: res.data }));
        } catch (error) {

            console.error(error);
            showToast("Failed to find fix", "error");
        } finally {
            setIsFixing(false);
        }
    }

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



    useEffect(() => {
        if (!location.state || !location.state.project) {
            navigate('/')
            return
        }

        // ISOLATION TEST: DISABLED SOCKET & WEBCONTAINE & API
        initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer()
                .then(container => {
                    setWebContainer(container)
                    console.log("WebContainer started successfully")
                })
                .catch(err => {
                    console.error("Failed to boot WebContainer:", err)
                    showToast("WebContainer failed to start. Refresh page.", "error")
                })
        }

        receiveMessage('project-message', data => {
            const message = data.message;

            // Check if message is JSON and contains fileTree
            try {
                const cleanMessage = message.replace(/```json\n?|```/g, '').trim();
                const parsedMessage = JSON.parse(cleanMessage);

                if (parsedMessage.fileTree) {
                    // Inject timestamp if missing
                    const timestamp = new Date().toISOString();
                    const treeWithTimestamp = { ...parsedMessage.fileTree };

                    Object.keys(treeWithTimestamp).forEach(key => {
                        if (treeWithTimestamp[key].file) {
                            treeWithTimestamp[key] = {
                                ...treeWithTimestamp[key],
                                lastModified: timestamp
                            };
                        }
                    });

                    // Update file tree
                    setFileTree(prevTree => {
                        const newTree = mergeFileTrees(prevTree, treeWithTimestamp);
                        saveFileTree(newTree); // Persist to backend
                        return newTree;
                    });
                    setProject(prev => {
                        const newTree = mergeFileTrees(prev.fileTree || {}, treeWithTimestamp);
                        return {
                            ...prev,
                            fileTree: newTree
                        }
                    })
                }
            } catch (e) {
                // Not JSON or invalid, just a normal message
            }

            if (data.sender._id === 'ai') {
                setIsAiThinking(false)
            }
            setMessages(prev => [...prev, data])
        })

        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        })

        axios.get(`/projects/get-messages/${location.state.project._id}`).then(res => {
            setMessages(res.data.messages)
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        })





        // Cleanup function for socket listeners
        return () => {
            // We can use the imported removeListener directly if we updated the import
            // For now, let's just make sure we don't crash and assuming imports will be fixed or we can just access socket instance via the existing import if it was default
            // Actually, initializeSocket returns the instance. 
            const socket = initializeSocket(project._id);
            if (socket) {
                socket.off('project-message');
                socket.off('project-activity');
            }
        }
    }, [])

    // Persistence: Restore state

    useEffect(() => {
        if (!project?._id) return;

        try {
            const savedOpenFiles = localStorage.getItem(`openFiles_${project._id}`);
            const savedCurrentFile = localStorage.getItem(`currentFile_${project._id}`);

            if (savedOpenFiles) {
                setOpenFiles(JSON.parse(savedOpenFiles));
            }
            if (savedCurrentFile) {
                setCurrentFile(savedCurrentFile);
            }
        } catch (e) {
            console.error("Error restoring project state:", e);
        }
    }, [project?._id]);

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

    const [serverUrl, setServerUrl] = useState(null); // Store base server URL

    // Smart Preview: Auto-update iframe when file changes
    useEffect(() => {
        if (serverUrl && currentFile && currentFile.endsWith('.html')) {
            const cleanFile = currentFile.startsWith('/') ? currentFile.slice(1) : currentFile;
            setIframeUrl(`${serverUrl}/${cleanFile}`);
        }
    }, [currentFile, serverUrl]);

    async function handleRun() {
        if (!webContainer) {
            console.warn("Run clicked but WebContainer is null")
            alert("WebContainer is booting... please wait.")
            return
        }

        if (isRunning) {
            console.log("Stopping run process...")
            if (runProcess) {
                runProcess.kill()
                setTerminalOutput(prev => [...prev, "\n> Process terminated by user."])
            }
            setIsRunning(false)
            setRunStatus(null)
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
                    setTerminalOutput(prev => [...prev, "Npm installation failed. Check console."])
                    // non-blocking warning
                } else {
                    setTerminalOutput(prev => [...prev, "Installation complete.", ""])
                }
            } else {
                setTerminalOutput(prev => [...prev, "No package.json, skipping npm install.", ""])
            }


            setRunStatus("starting")
            setTerminalOutput(prev => [...prev, "Starting server..."])
            setIframeUrl(null)

            if (runProcess) {
                runProcess.kill()
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            let tempProcess;

            // SMART RUN LOGIC: Check if current file is Python
            if (currentFile && currentFile.endsWith('.py')) {
                setTerminalOutput(prev => [...prev, `> python3 ${currentFile}`, ""])
                tempProcess = await webContainer.spawn("python3", [currentFile])
            }
            // SMART RUN LOGIC: Check if current file is JavaScript (Standalone)
            else if (currentFile && currentFile.endsWith('.js') && currentFile !== 'server.js') {
                // We exclude server.js from "standalone" logic if we want to allow it to run via npm start potentially?
                // Actually, running `node server.js` directly is usually fine too.
                // let's just run it directly.
                setTerminalOutput(prev => [...prev, `> node ${currentFile}`, ""])
                tempProcess = await webContainer.spawn("node", [currentFile])
            }
            // Default Node.js Logic (npm start)
            else if (fileTree['package.json'] && fileTree['package.json'].file.contents.includes('"start"')) {
                setTerminalOutput(prev => [...prev, "> npm start"])
                tempProcess = await webContainer.spawn("npm", ["start"])
            }
            else {
                setTerminalOutput(prev => [...prev, "> node server.js"])
                tempProcess = await webContainer.spawn("node", ["server.js"])
            }

            tempProcess.output.pipeTo(new WritableStream({
                write(chunk) {
                    const str = chunk.toString();
                    const cleanStr = stripAnsi(str);
                    if (cleanStr.trim()) {
                        setTerminalOutput(prev => [...prev, cleanStr])
                    }
                }
            }))


            setRunProcess(tempProcess)
            setRunStatus("running")

            // CRITICAL FIX: Listen for exit
            tempProcess.exit.then((code) => {
                console.log("Process exited with code", code);
                setTerminalOutput(prev => [...prev, `\nProcess exited with code ${code}`])
                setIsRunning(false);
                setRunStatus(null);
            })

        } catch (error) {
            console.error(error)
            setTerminalOutput(prev => [...prev, `\nError: ${error.message}\n`])
            alert("Failed to run: " + error.message)
            setIsRunning(false)
            setRunStatus(null)
        }
    }

    function downloadFile() {
        if (!currentFile || !fileTree[currentFile]) return;
        const fileContent = fileTree[currentFile].file.contents;
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFile;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }


    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

    function shareToWhatsApp() {
        if (!currentFile || !fileTree[currentFile]) return;
        const fileContent = fileTree[currentFile].file.contents;
        // Truncate if too long (approx limit for URL is 2000, keep safety margin)
        const textToShare = fileContent.length > 1500
            ? fileContent.substring(0, 1500) + "...(truncated)"
            : fileContent;

        const url = `https://api.whatsapp.com/send?text=*${encodeURIComponent(currentFile)}*%0A%0A${encodeURIComponent(textToShare)}`;
        window.open(url, '_blank');
        setIsShareMenuOpen(false);
    }

    function shareToMail() {
        if (!currentFile || !fileTree[currentFile]) return;
        const fileContent = fileTree[currentFile].file.contents;
        const textToShare = fileContent.length > 1500
            ? fileContent.substring(0, 1500) + "...(truncated)"
            : fileContent;

        const url = `mailto:?subject=${encodeURIComponent(currentFile)}&body=${encodeURIComponent(textToShare)}`;
        window.open(url, '_blank');
        setIsShareMenuOpen(false);
    }

    function copyToClipboard() {
        if (!currentFile || !fileTree[currentFile]) return;
        const fileContent = fileTree[currentFile].file.contents;
        navigator.clipboard.writeText(fileContent);
        showToast("Copied to clipboard", "success");
        setIsShareMenuOpen(false);
    }

    // Separate Effect for Server Ready to avoid listener stacking
    useEffect(() => {
        if (!webContainer) return;

        const unsubscribe = webContainer.on('server-ready', (port, url) => {
            console.log("Server Ready Event:", port, url);
            const activeFile = currentFileRef.current; // Get fresh value

            // REMOVED: Python preview blocker. Now allowing all previews.

            setTerminalOutput(prev => [...prev, `\nServer ready at ${url}\n`])
            setServerUrl(url);

            // Construct specific URL
            let finalUrl = url;
            if (activeFile && activeFile.endsWith('.html')) {
                const cleanFile = activeFile.startsWith('/') ? activeFile.slice(1) : activeFile;
                finalUrl = `${url}/${cleanFile}`;
            }

            setIframeUrl(finalUrl)

            // Only stop spinner if we are "starting", if we are "running" (e.g. restart) it's fine
            // actually handleRun sets running.
        });

        return () => {
            // WebContainer doesn't provide easy off for specific listener if we don't hold ref, 
            // but in React useEffect cleanup, we should try.
            // However, native WebContainer API 'on' returns a teardown function usually? 
            // Checking docs... V1 returns Unsubscribe. Assuming yes.
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [webContainer]);

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
                        onClick={() => setIsSearchModalOpen(true)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="Search"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                    <button
                        onClick={fetchStats}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="View Stats"
                    >
                        <BarChart2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="AI Preferences"
                    >
                        <Settings className="w-5 h-5" />
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

                <SearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    projectId={project._id}
                    onFileClick={(filename) => {
                        setCurrentFile(filename);
                        setOpenFiles(prev => [...new Set([...prev, filename])]);
                    }}
                    onMessageClick={(messageId) => {
                        // Use setTimeout to allow modal to close and UI to update
                        setTimeout(() => {
                            const element = document.getElementById(`message-${messageId}`);
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Add a highlight class temporarily
                                element.classList.add('bg-blue-500/20');
                                setTimeout(() => {
                                    element.classList.remove('bg-blue-500/20');
                                }, 2000);
                            } else {
                                console.warn("Message element not found:", messageId);
                            }
                        }, 100);
                    }}
                />

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
                                id={`message-${msg._id}`}
                                className={clsx(
                                    "flex flex-col max-w-[85%] transition-colors duration-500 rounded-lg p-1", // Added transition and padding for highlight effect
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
                                        <AiMessage message={msg.message} />
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
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span>Files {filteredFiles.length}</span>
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                    className="p-1 hover:bg-slate-800 rounded transition-colors"
                                    title="Filter Files"
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                                {isFilterMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                        <div className="p-2 flex flex-col gap-1">
                                            {['all', 'today', 'yesterday'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => { setFileFilter(f); setIsFilterMenuOpen(false); }}
                                                    className={clsx(
                                                        "text-left px-3 py-2 text-sm rounded-md transition-colors capitalize",
                                                        fileFilter === f ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                                                    )}
                                                >
                                                    {f} Files
                                                </button>
                                            ))}
                                            <div className="border-t border-slate-800 my-1"></div>
                                            <div className="px-3 py-2 text-xs text-slate-500">Custom Date</div>
                                            <input
                                                type="date"
                                                className="w-full bg-slate-800 text-white text-xs p-2 rounded border border-slate-700 focus:outline-none focus:border-blue-500"
                                                onChange={(e) => {
                                                    setFilterDate(e.target.value);
                                                    setFileFilter('custom');
                                                    setIsFilterMenuOpen(false);
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="file-tree flex-grow overflow-auto p-2">
                            {filteredFiles.map((file, index) => (
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
                                        "w-full text-left p-2 px-3 rounded-lg flex flex-col mb-1 transition-all group", // Changed to flex-col for date display
                                        currentFile === file ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                                    )}>
                                    <div className="flex items-center gap-2 w-full">
                                        <FileCode className="w-4 h-4 opacity-70 shrink-0" />
                                        <span className='text-sm truncate flex-grow'>{file}</span>
                                    </div>
                                    {/* Timestamp */}
                                    {fileTree[file].lastModified && (
                                        <div className="flex items-center gap-1 ml-6 mt-0.5 opacity-50 text-[10px]">
                                            <Clock className="w-3 h-3" />
                                            <span>
                                                {format(new Date(fileTree[file].lastModified), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                    )}
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
                                className="mr-2 px-6 h-9 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 transition-all whitespace-nowrap"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Ask AI
                            </motion.button>

                            {/* Run Button Enhancement */}
                            <div className="actions flex items-center gap-4 px-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleRun}
                                    disabled={!webContainer}
                                    className={clsx(
                                        "px-6 py-2 rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg transition-all",
                                        (!webContainer)
                                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                            : isRunning && runStatus === 'running'
                                                ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/40"
                                                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/40"
                                    )}
                                >
                                    {!webContainer ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Booting...
                                        </>
                                    ) : (isRunning && runStatus !== 'running') ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {runStatus === 'mounting' ? 'Mounting...' :
                                                runStatus === 'installing' ? 'Installing...' :
                                                    runStatus === 'starting' ? 'Starting...' : 'Loading...'}
                                        </>
                                    ) : (isRunning && runStatus === 'running') ? (
                                        <>
                                            <div className="w-3 h-3 bg-white rounded-sm" />
                                            Stop
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 fill-current" />
                                            Run
                                        </>
                                    )}
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAnalyzeCode}
                                    disabled={isAnalyzing}
                                    className="px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40 transition-all"
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Brain className="w-4 h-4" />
                                    )}
                                    {isAnalyzing ? "Analyzing..." : "Review"}
                                </motion.button>
                                <button
                                    onClick={() => {
                                        const prompt = "@ai Regenerate server.js to explicitly serve all static files (index.html, project.html, etc) using app.use(express.static('.')).";
                                        sendMessage('project-message', {
                                            message: prompt,
                                            sender: user
                                        });
                                        setMessages(prev => [...prev, { sender: user, message: prompt }]);
                                        setIsAiThinking(true);
                                    }}
                                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
                                    title="Fix Server (404 Error)"
                                >
                                    <Shield className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={downloadFile}
                                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
                                    title="Download File"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
                                        title="Share Options"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                    {isShareMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                            <div className="p-1 flex flex-col">
                                                <button
                                                    onClick={shareToWhatsApp}
                                                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-green-400 rounded-lg transition-colors text-left"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    WhatsApp
                                                </button>
                                                <button
                                                    onClick={shareToMail}
                                                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-blue-400 rounded-lg transition-colors text-left"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    Email
                                                </button>
                                                <button
                                                    onClick={copyToClipboard}
                                                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-left border-t border-slate-800 mt-1 pt-2"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                    Copy Code
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                                        ...fileTree[currentFile],
                                                        file: {
                                                            ...fileTree[currentFile].file,
                                                            contents: updatedContent
                                                        },
                                                        lastModified: new Date().toISOString()
                                                    }
                                                }
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }}
                                            dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[currentFile]?.file?.contents || '').value }}
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
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={openSmartFix}
                                        className="text-amber-400 hover:text-amber-300 text-xs transition-colors flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"
                                        title="Auto-fix errors using AI/History"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Smart Fix
                                    </button>
                                    <button
                                        onClick={() => setTerminalOutput([])}
                                        className="text-slate-500 hover:text-red-400 text-xs transition-colors flex items-center gap-1"
                                    >
                                        <X className="w-3 h-3" />
                                        Clear
                                    </button>
                                </div>
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
                                <button
                                    onClick={() => {
                                        setIframeUrl(null);
                                        setIsRunning(false);
                                        setRunStatus(null);
                                        if (runProcess) {
                                            runProcess.kill();
                                            setRunProcess(null);
                                            setTerminalOutput(prev => [...prev, "Process stopped by user."]);
                                        }
                                    }}
                                    className="p-1.5 hover:bg-slate-800 rounded-md text-red-500 hover:text-red-400 transition-colors"
                                    title="Stop Server & Close Preview"
                                >
                                    <X className="w-3.5 h-3.5" />
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

            {/* AI Feedback Modal */}
            <AnimatePresence>
                {isFeedbackModalOpen && feedbackData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-[500px] shadow-2xl relative flex flex-col gap-4"
                        >
                            <header className='flex justify-between items-center border-b border-slate-800 pb-4'>
                                <h2 className='text-xl font-bold text-white flex items-center gap-2'>
                                    <Brain className="w-6 h-6 text-emerald-500" />
                                    AI Code Review
                                </h2>
                                <button onClick={() => setIsFeedbackModalOpen(false)} className='p-2 hover:bg-slate-800 rounded-full transition-colors'>
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </header>

                            {/* Language Toggle for Code Review */}
                            <div className="flex justify-center mb-2">
                                <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex gap-1">
                                    <button
                                        onClick={() => handleAnalyzeCode('English')}
                                        className={clsx(
                                            "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                            reviewLanguage === 'English'
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        )}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => handleAnalyzeCode('Hinglish')}
                                        className={clsx(
                                            "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                            reviewLanguage === 'Hinglish'
                                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        )}
                                    >
                                        Hinglish (Bhai Style)
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                                    <span className="text-slate-400 text-sm font-medium">Difficulty Rating</span>
                                    <span className={clsx(
                                        "px-3 py-1 rounded-full text-sm font-bold border",
                                        feedbackData.rating === 'Beginner' ? "bg-green-500/20 text-green-400 border-green-500/30" :
                                            feedbackData.rating === 'Intermediate' ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                                                "bg-red-500/20 text-red-400 border-red-500/30"
                                    )}>
                                        {feedbackData.rating}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                                        Improvement Tips
                                    </h3>
                                    <ul className="space-y-3">
                                        {feedbackData.tips.map((tip, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsFeedbackModalOpen(false)}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium mt-2"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Feature 2: Settings Modal */}
            <AnimatePresence>
                {isSettingsModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-[400px] shadow-2xl relative"
                        >
                            <header className='flex justify-between items-center mb-6'>
                                <h2 className='text-xl font-bold text-white flex items-center gap-2'>
                                    <Settings className="w-5 h-5 text-blue-500" />
                                    AI Preferences
                                </h2>
                                <button onClick={() => setIsSettingsModalOpen(false)} className='p-2 hover:bg-slate-800 rounded-full transition-colors'>
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </header>
                            <form onSubmit={handleSavePreferences} className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-400 block mb-2">Preferred Stack</label>
                                    <select
                                        value={preferences.preferredStack}
                                        onChange={e => setPreferences({ ...preferences, preferredStack: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                    >
                                        <option value="React/Node">React & Node.js (Default)</option>
                                        <option value="Vanilla JS">Vanilla HTML/JS</option>
                                        <option value="Vue">Vue.js</option>
                                        <option value="Python/Flask">Python/Flask</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 block mb-2">Code Style</label>
                                    <select
                                        value={preferences.codeStyle}
                                        onChange={e => setPreferences({ ...preferences, codeStyle: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                    >
                                        <option value="Standard">Standard (Balanced)</option>
                                        <option value="Concise">Concise (Minimal comments)</option>
                                        <option value="Detailed">Detailed (Educational)</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 font-medium flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> Save Preferences
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feature 3: Smart Fix Modal */}
            <AnimatePresence>
                {isSmartFixOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-[500px] shadow-2xl relative flex flex-col gap-4 max-h-[80vh]"
                        >
                            <header className='flex justify-between items-center border-b border-slate-800 pb-4'>
                                <h2 className='text-xl font-bold text-white flex items-center gap-2'>
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    Smart Fix
                                </h2>
                                <button onClick={() => setIsSmartFixOpen(false)} className='p-2 hover:bg-slate-800 rounded-full transition-colors'>
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </header>

                            {/* Language Toggle */}
                            <div className="flex justify-center mb-2">
                                <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex gap-1">
                                    <button
                                        onClick={() => handleSmartFix('English')}
                                        className={clsx(
                                            "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                            smartFixLanguage === 'English'
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        )}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => handleSmartFix('Hinglish')}
                                        className={clsx(
                                            "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
                                            smartFixLanguage === 'Hinglish'
                                                ? "bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        )}
                                    >
                                        Hinglish (Bhai Style)
                                    </button>
                                </div>
                            </div>

                            {!fixResult ? (
                                <div className="flex flex-col gap-4">
                                    <label className="text-sm text-slate-400">Describe the error or paste the log:</label>
                                    <textarea
                                        value={fixErrorInput}
                                        onChange={(e) => setFixErrorInput(e.target.value)}
                                        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-red-300 font-mono focus:border-amber-500 outline-none resize-none"
                                        placeholder="ReferenceError: x is not defined..."
                                    ></textarea>
                                    <button
                                        onClick={() => handleSmartFix()}
                                        disabled={isFixing}
                                        className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded-lg py-2 font-medium flex items-center justify-center gap-2"
                                    >
                                        {isFixing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {isFixing ? "Searching Memory & AI..." : "Find Fix"}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 overflow-y-auto">
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                                        <span className="text-slate-400 text-xs">Source</span>
                                        <span className={clsx(
                                            "px-2 py-1 rounded text-xs font-bold border",
                                            fixResult.source.includes("Memory") ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                        )}>
                                            {fixResult.source}
                                        </span>
                                    </div>
                                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-200 text-sm whitespace-pre-wrap font-mono">
                                        {fixResult.fix}
                                    </div>
                                    <button
                                        onClick={() => { setFixResult(null); setFixErrorInput(''); }}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-lg py-2 font-medium"
                                    >
                                        Fix Another
                                    </button>
                                </div>
                            )}

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