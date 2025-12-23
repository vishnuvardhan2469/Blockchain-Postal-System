import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Package, ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const History = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Use mobile as identifier
                const res = await axios.get(`http://localhost:3001/api/user/history/${user.mobile}`);
                if (res.data.success) {
                    setHistory(res.data.history.reverse()); // Newest first
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };

        if (user.mobile) {
            fetchHistory();
        }
    }, [user.mobile]);

    return (
        <div className="min-h-screen bg-slate-900 p-4 text-slate-100 font-sans">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-full hover:bg-slate-800 transition"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold font-['Orbitron']">TRANSACTION HISTORY</h1>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500 animate-pulse">Loading records...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Clock size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No transaction history found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel p-4 flex items-center justify-between border-slate-700 hover:border-slate-600 transition-colors"
                                style={{ margin: 0, width: '100%', maxWidth: 'none' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.type === 'SENT' ? 'bg-blue-900/50 text-blue-400' : 'bg-green-900/50 text-green-400'
                                        }`}>
                                        {item.type === 'SENT' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{item.description}</p>
                                        <div className="flex gap-3 text-sm text-slate-400">
                                            <span>{item.date}</span>
                                            <span>•</span>
                                            <span>{item.weight ? `${item.weight} kg` : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold mb-1 inline-block ${item.status === 'DELIVERED' ? 'bg-green-500/20 text-green-400' :
                                            item.status === 'IN_TRANSIT' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-slate-700 text-slate-300'
                                        }`}>
                                        {item.status?.replace('_', ' ')}
                                    </div>
                                    <p className="text-xs text-slate-500">{item.time}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
