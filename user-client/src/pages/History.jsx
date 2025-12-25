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
                const { getContract } = await import('../utils/blockchain');
                const contract = await getContract();
                if (!contract) return;

                const orders = await contract.getOrders();

                // Filter for current user
                const userOrders = orders.filter(o =>
                    o.senderAadhar === user.aadhar || o.receiverMobile === user.mobile
                );

                const mappedHistory = userOrders.map(o => ({
                    id: o.id.toString(),
                    type: o.senderAadhar === user.aadhar ? 'SENT' : 'RECEIVED',
                    description: o.description,
                    weight: o.weight,
                    target: o.senderAadhar === user.aadhar ? `To: ${o.receiverEmail}` : `From: ${o.senderAadhar}`,
                    sendDate: new Date(Number(o.timestamp) * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
                    deliveryDate: (o.deliveryTimestamp && Number(o.deliveryTimestamp) > 0)
                        ? new Date(Number(o.deliveryTimestamp) * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                        : null,
                    status: o.status
                }));

                setHistory(mappedHistory.reverse());

            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };

        if (user.aadhar || user.mobile) {
            fetchHistory();
        }
    }, [user.aadhar, user.mobile]);

    return (
        <div className="min-h-screen p-4 text-black font-sans">
            {/* Fixed Back Button */}
            <button
                onClick={() => navigate('/dashboard')}
                className="fixed top-28 left-8 text-sm font-bold uppercase tracking-wide text-black hover:underline border-2 border-black hover:bg-black hover:text-white px-3 py-1 rounded-lg transition z-[2000]"
            >
                BACK
            </button>

            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <h1 className="text-3xl font-black uppercase text-black italic tracking-tighter">Transaction History</h1>
                </div>
                <div className="h-1 w-full bg-black mb-8 -mt-6"></div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500 animate-pulse font-bold">Loading records...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-bold">
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
                                className="glass-panel p-6 flex flex-col gap-4"
                                style={{ margin: 0, width: '100%', maxWidth: 'none' }}
                            >
                                {/* Row 1: ID and Status */}
                                <div className="flex justify-between items-center border-b-2 border-slate-100 pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-black ${item.type === 'SENT' ? 'bg-blue-100' : 'bg-white'}`}>
                                            {item.type === 'SENT' ? <ArrowUpRight size={16} className="text-blue-600" /> : <ArrowDownLeft size={16} className="text-black" />}
                                        </div>
                                        <span className="font-mono font-black text-sm tracking-widest text-slate-500">{item.id}</span>
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border-2 border-black ${item.status === 'DELIVERED' ? 'bg-green-100 text-green-800 border-green-600' :
                                            item.status === 'IN_TRANSIT' ? 'bg-blue-600 text-white border-blue-800' :
                                                'bg-slate-100 text-slate-500'
                                        }`}>
                                        {item.status?.replace('_', ' ')}
                                    </div>
                                </div>

                                {/* Row 2: Description and Target */}
                                <div>
                                    <h3 className="text-xl font-black text-black uppercase italic tracking-tight mb-1">{item.description}</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{item.target} • {item.weight ? `${item.weight} kg` : 'N/A'}</p>
                                </div>

                                {/* Row 3: Timestamps */}
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Sent Time</p>
                                        <p className="text-xs font-mono font-bold text-black">{item.sendDate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Delivered Time</p>
                                        {item.deliveryDate ? (
                                            <p className="text-xs font-mono font-bold text-green-700">{item.deliveryDate}</p>
                                        ) : (
                                            <p className="text-xs font-bold text-slate-300 italic">-- : --</p>
                                        )}
                                    </div>
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
