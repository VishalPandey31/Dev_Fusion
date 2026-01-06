
import React, { useState } from 'react';
import axios from '../config/axios';
import { X, Search, FileCode, MessageSquare, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchModal = ({ isOpen, onClose, projectId, onFileClick, onMessageClick }) => {
    const [query, setQuery] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState('all'); // 'all', 'file', 'chat'
    const [results, setResults] = useState({ files: [], chats: [] });
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!query && !date) return;
        setLoading(true);
        setSearched(false);
        try {
            const res = await axios.get('/projects/search', {
                params: {
                    projectId,
                    query,
                    date,
                    type
                }
            });
            setResults(res.data.results);
            setSearched(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" />
                        Search Project
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters & Input */}
                <div className="p-4 flex flex-col gap-4 bg-slate-900/50">
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Search files or messages..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        </div>
                        <input
                            type="date"
                            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-auto" // w-auto for better fit
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Search
                        </button>
                    </div>

                    {/* Type Filters */}
                    <div className="flex gap-2">
                        {['all', 'file', 'chat'].map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${type === t
                                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}s
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                    {loading && (
                        <div className="text-center py-8 text-slate-500">
                            Searching...
                        </div>
                    )}

                    {!loading && searched && results.files.length === 0 && results.chats.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            No results found.
                        </div>
                    )}

                    {/* File Results */}
                    {results.files.length > 0 && (type === 'all' || type === 'file') && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FileCode className="w-3 h-3" /> Files
                            </h3>
                            <div className="grid gap-2">
                                {results.files.map((file, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (onFileClick) onFileClick(file.name); // Using name as key for now based on fileTree structure
                                            onClose();
                                        }}
                                        className="text-left w-full p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-all group"
                                    >
                                        <div className="flex items-center gap-2 text-sm text-blue-400 font-mono mb-1">
                                            <FileCode className="w-4 h-4" />
                                            <span className="group-hover:underline">{file.name}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">{file.path}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chat Results */}
                    {results.chats.length > 0 && (type === 'all' || type === 'chat') && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" /> Messages
                            </h3>
                            <div className="grid gap-2">
                                {results.chats.map((msg, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (onMessageClick && msg._id) onMessageClick(msg._id);
                                            onClose();
                                        }}
                                        className="w-full text-left p-3 bg-slate-800/30 border border-slate-800 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors">
                                                {msg.sender?.email || 'Unknown'}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(msg.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 line-clamp-2 group-hover:text-slate-300">
                                            {typeof msg.message === 'string' ? msg.message.substring(0, 150) : JSON.stringify(msg.message)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default SearchModal;
