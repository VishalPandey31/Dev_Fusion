
import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

const ProjectUsageStats = ({ isOpen, onClose, projectId }) => {
    const [view, setView] = useState('summary'); // 'summary' or 'logs'
    const [stats, setStats] = useState({ aggregated: [], logs: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && projectId && projectId !== 'undefined') {
            fetchStats();
        }
    }, [isOpen, projectId]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/admin/project-stats?projectId=${projectId}`);
            setStats({
                aggregated: res.data.stats || [],
                logs: res.data.logs || []
            });
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch stats", err);
            setError("Failed to load statistics");
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Helper to format duration
    const formatDuration = (seconds) => {
        if (!seconds) return '---';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Project Usage Stats
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Track member activity and sessions</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-gray-900/50">
                    <button
                        onClick={() => setView('summary')}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${view === 'summary' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        Summary Overview
                    </button>
                    <button
                        onClick={() => setView('logs')}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${view === 'logs' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        Detailed Activity Log
                    </button>
                </div>

                <div className="p-6 overflow-auto bg-[#0d1117]">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-400 text-center p-4 bg-red-900/10 rounded-lg border border-red-900/50">
                            {error}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            {view === 'summary' ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                            <th className="p-4 font-medium">User</th>
                                            <th className="p-4 font-medium text-center">Total Logins</th>
                                            <th className="p-4 font-medium text-right">Total Time</th>
                                            <th className="p-4 font-medium text-right">Last Active</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {stats.aggregated.map((stat) => (
                                            <tr key={stat._id} className="hover:bg-gray-800/30 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                                            {stat.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-white">{stat.email}</div>
                                                            <div className="text-xs text-gray-500">{stat.isAdmin ? 'Admin' : 'Member'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center text-gray-300 font-mono">
                                                    {stat.loginCount}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-blue-400 font-mono text-sm">
                                                        {formatDuration(stat.totalDuration)}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right text-gray-400 text-sm font-mono">
                                                    {new Date(stat.lastLogin).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {stats.aggregated.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-center py-8 text-gray-500">No summary data found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                            <th className="p-4 font-medium">Status</th>
                                            <th className="p-4 font-medium">User</th>
                                            <th className="p-4 font-medium">Login Time</th>
                                            <th className="p-4 font-medium">Logout Time</th>
                                            <th className="p-4 font-medium text-right">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {stats.logs.map((log) => {
                                            const isActive = !log.logoutTime;
                                            return (
                                                <tr key={log._id} className="hover:bg-gray-800/30 transition-colors">
                                                    <td className="p-4">
                                                        <div className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full w-fit ${isActive ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-gray-800 text-gray-500'}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                                                            {isActive ? 'Active Now' : 'Offline'}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-300">
                                                                {log.userId?.email?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            <span className="text-sm text-gray-300">{log.userId?.email || 'Unknown User'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-400 font-mono">
                                                        {new Date(log.loginTime).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-400 font-mono">
                                                        {log.logoutTime ? new Date(log.logoutTime).toLocaleString() : '---'}
                                                    </td>
                                                    <td className="p-4 text-right text-sm text-blue-400 font-mono">
                                                        {formatDuration(log.duration)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {stats.logs.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-8 text-gray-500">No activity logs found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectUsageStats;
