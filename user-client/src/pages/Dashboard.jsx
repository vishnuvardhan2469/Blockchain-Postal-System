// user-client/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Package, Truck, Key, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import OtpDisplay from '../components/ui/OtpDisplay';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3001');

const Dashboard = () => {
    console.log("DASHBOARD RELOADED - VERSION CHECK");
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [view, setView] = useState('MAIN'); // MAIN, SEND_FLOW, RECEIVE_FLOW
    const [orderStatus, setOrderStatus] = useState('IDLE'); // IDLE, OTP_RECEIVED, FORM_INPUT, TRANSIT
    const [currentOtp, setCurrentOtp] = useState(null);
    const [currentTransactionId, setCurrentTransactionId] = useState(null);
    const [receiverData, setReceiverData] = useState({ address: '', mobile: '' });

    useEffect(() => {
        if (user.aadhar) {
            // Listen for OTP generation (Sent by Controller during Face Scan)
            socket.on(`otp-generated-${user.aadhar}`, (data) => {
                console.log("OTP Received!", data);
                setCurrentOtp(data.otp);
                setCurrentTransactionId(data.transactionId);
                setOrderStatus('OTP_RECEIVED');
                // Auto switch view if needed
                if (data.type === 'SEND') setView('SEND_FLOW');
                if (data.type === 'RECEIVE') setView('RECEIVE_FLOW');
            });

            // Listen for Verification Success (Controller entered OTP)
            socket.on(`transaction-verified-${user.aadhar}`, (data) => {
                if (data.type === 'SEND') {
                    setOrderStatus('FORM_INPUT');
                } else {
                    setOrderStatus('DELIVERED');
                }
                setCurrentOtp(null);
            });

            // Listen for final status
            socket.on(`order-status-${user.aadhar}`, (data) => {
                if (data.status === 'IN_TRANSIT') {
                    setOrderStatus('TRANSIT');
                }
            });
        }
        return () => socket.off();
    }, [user.aadhar]);

    const handleAddressSubmit = async () => {
        try {
            await axios.post('http://localhost:3001/api/user/complete-order', {
                transactionId: currentTransactionId,
                receiverAddress: receiverData.address,
                receiverMobile: receiverData.mobile,
                packageDescription: receiverData.description || 'Standard Post',
                packageWeight: receiverData.weight || '0.5'
            });
            // State update handled by socket `order-status` or manually here
            setOrderStatus('TRANSIT');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="bg-slate-900 min-h-screen p-4 text-slate-50 font-sans">


            <main className="max-w-7xl mx-auto flex justify-center items-center min-h-[80vh]">
                {view === 'MAIN' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        columnGap: '8rem',
                        rowGap: '3rem',
                        width: '100%',
                        maxWidth: '1000px',
                        margin: '0 auto',
                        padding: '4rem',
                        justifyItems: 'center'
                    }}>
                        <div style={{ width: '100%', maxWidth: '240px', transform: 'translateX(-40px)' }}>
                            <Card
                                icon={<Send size={32} className="text-blue-400" />}
                                title="Send Post"
                                desc="Dispatch generic items."
                                onClick={() => setView('SEND_FLOW')}
                            />
                        </div>
                        <div style={{ width: '100%', maxWidth: '240px' }}>
                            <Card
                                icon={<Package size={32} className="text-green-400" />}
                                title="Receive Post"
                                desc="Collect your deliveries."
                                onClick={() => setView('RECEIVE_FLOW')}
                            />
                        </div>
                        <div style={{ width: '100%', maxWidth: '240px', transform: 'translateX(-40px)' }}>
                            <Card
                                icon={<div className="text-purple-400 font-bold text-2xl">ID</div>}
                                title="Face ID Setup"
                                desc="Register verification."
                                onClick={() => window.location.href = '/face-setup'}
                            />
                        </div>
                        <div style={{ width: '100%', maxWidth: '240px' }}>
                            <Card
                                icon={<Clock size={32} className="text-orange-400" />}
                                title="History"
                                desc="View past transactions."
                                onClick={() => window.location.href = '/history'}
                            />
                        </div>
                    </div>
                )}
                {
                    view === 'SEND_FLOW' && (
                        <div className="glass-panel p-6 relative min-h-[400px]">
                            <button onClick={() => setView('MAIN')} className="absolute top-4 left-4 text-sm text-slate-400">← Back</button>

                            <div className="mt-8 text-center">
                                <h2 className="text-2xl font-bold mb-6">Send Package</h2>

                                {orderStatus === 'IDLE' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div className="p-8 border border-dashed border-slate-600 rounded-xl mb-4">
                                            <p className="text-slate-300 mb-2">Please proceed to the Controller Counter.</p>
                                            <p className="text-sm text-slate-500">The agent will verify your identity via Face Scan. Once scanned, an OTP will appear here.</p>
                                        </div>
                                        <div className="animate-pulse text-blue-400">Waiting for Controller...</div>
                                    </motion.div>
                                )}

                                {orderStatus === 'OTP_RECEIVED' && (
                                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                                        <p className="mb-4 text-slate-300">Share this OTP with the Controller</p>
                                        <div className="mb-8">
                                            <OtpDisplay otp={currentOtp} />
                                        </div>
                                        <div className="text-sm text-red-400 animate-pulse">Expires in 5:00</div>
                                    </motion.div>
                                )}

                                {orderStatus === 'FORM_INPUT' && (
                                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                                        <h3 className="text-xl mb-4 text-green-400 flex items-center justify-center gap-2">
                                            <CheckCircle size={24} /> Identity Verified
                                        </h3>
                                        <div className="space-y-4 max-w-md mx-auto">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    placeholder="Item Description"
                                                    value={receiverData.description || ''}
                                                    onChange={(e) => setReceiverData({ ...receiverData, description: e.target.value })}
                                                />
                                                <Input
                                                    placeholder="Weight (kg)"
                                                    type="number"
                                                    value={receiverData.weight || ''}
                                                    onChange={(e) => setReceiverData({ ...receiverData, weight: e.target.value })}
                                                />
                                            </div>
                                            <Input
                                                placeholder="Receiver Address"
                                                value={receiverData.address}
                                                onChange={(e) => setReceiverData({ ...receiverData, address: e.target.value })}
                                            />
                                            <Input
                                                placeholder="Receiver Mobile"
                                                value={receiverData.mobile}
                                                onChange={(e) => setReceiverData({ ...receiverData, mobile: e.target.value })}
                                            />
                                            <Button onClick={handleAddressSubmit}>Confirm Order</Button>
                                        </div>
                                    </motion.div>
                                )}

                                {orderStatus === 'TRANSIT' && (
                                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="py-12">
                                        <div className="flex justify-center mb-6">
                                            <motion.div
                                                animate={{ x: [0, 50, -50, 0] }}
                                                transition={{ repeat: Infinity, duration: 4 }}
                                            >
                                                <Truck size={64} className="text-blue-500" />
                                            </motion.div>
                                        </div>
                                        <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                                            Order is Travelling
                                        </h3>
                                        <p className="text-slate-400 mt-2">Your package is on its way!</p>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )
                }

                {
                    view === 'RECEIVE_FLOW' && (
                        <div className="glass-panel p-6 relative text-center">
                            <button onClick={() => setView('MAIN')} className="absolute top-4 left-4 text-sm text-slate-400">← Back</button>
                            <h2 className="text-2xl font-bold mb-6 mt-8">Receive Package</h2>

                            {orderStatus === 'IDLE' && <p>Waiting for Delivery Agent...</p>}

                            {orderStatus === 'OTP_RECEIVED' && (
                                <div>
                                    <p className="mb-4">Share this OTP with Delivery agent</p>
                                    <div className="mb-4">
                                        <OtpDisplay otp={currentOtp} />
                                    </div>
                                </div>
                            )}

                            {orderStatus === 'DELIVERED' && (
                                <div className="text-green-500 text-xl font-bold">
                                    Package Delivered Successfully!
                                </div>
                            )}
                        </div>
                    )
                }
            </main >
        </div >
    );
};

const Card = ({ icon, title, desc, onClick }) => (
    <motion.div
        whileHover={{ y: -5 }}
        onClick={onClick}
        className="glass-panel hover:border-blue-500/50 transition-colors"
        style={{
            minHeight: '250px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '1.5rem',
            cursor: 'pointer',
            width: '100%',
            maxWidth: 'none',
            margin: 0
        }}
    >
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-slate-400">{desc}</p>
    </motion.div>
);

export default Dashboard;
