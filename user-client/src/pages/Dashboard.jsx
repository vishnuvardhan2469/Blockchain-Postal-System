// user-client/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Package, Truck, Key, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import OtpDisplay from '../components/ui/OtpDisplay';
import io from 'socket.io-client';
import axios from 'axios';

const Dashboard = () => {
    console.log("DASHBOARD RELOADED - BLOCKCHAIN VERSION");
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [view, setView] = useState('MAIN'); // MAIN, SEND_FLOW, RECEIVE_FLOW
    const [orderStatus, setOrderStatus] = useState('IDLE'); // IDLE, OTP_RECEIVED, FORM_INPUT, TRANSIT
    const [currentOtp, setCurrentOtp] = useState(null);
    const [lastCreatedOrderId, setLastCreatedOrderId] = useState(null); // New state for success view
    const [receiverData, setReceiverData] = useState({ address: '', mobile: '', description: '', weight: '', email: '' });
    const [incomingOrders, setIncomingOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // BLOCKCHAIN REF
    const [contract, setContract] = useState(null);

    // Initialize Blockchain
    useEffect(() => {
        const initBlockchain = async () => {
            const { getContract } = await import('../utils/blockchain');
            const c = await getContract();
            setContract(c);
        };
        initBlockchain();
    }, []);

    // Listeners
    // Listeners
    useEffect(() => {
        if (contract && user.aadhar) {
            console.log("Listening for Blockchain Events...");

            // 1. Controller Scanned Face -> Generate and Show OTP
            const onUserVerified = (verifiedAadhar) => {
                console.log("User Verified Signal:", verifiedAadhar);
                if (verifiedAadhar === user.aadhar) {
                    const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
                    setCurrentOtp(mockOtp);
                    setOrderStatus('OTP_RECEIVED');
                    // In a real app, this OTP would be sent to backend or saved on chain hashed
                    // For demo, we just show it to user to tell controller.
                }
            };

            // 2. Controller Entered Rights OTP -> Grant Access
            const onAccessGranted = (grantedAadhar) => {
                console.log("Access Granted Signal:", grantedAadhar);
                if (grantedAadhar === user.aadhar) {
                    setOrderStatus('FORM_INPUT');
                }
            };

            // Listener: Order Status
            const onOrderStatus = (id, status) => {
                if (status === 'IN_TRANSIT') setOrderStatus('TRANSIT');

                // Real-time update for Receiver
                if (status === 'DELIVERED') {
                    setIncomingOrders(prev => prev.map(o =>
                        o.id === id ? { ...o, status: 'DELIVERED' } : o
                    ));
                }
            };

            contract.on('UserVerified', onUserVerified);
            contract.on('AccessGranted', onAccessGranted);
            contract.on('OrderStatusUpdated', onOrderStatus);

            return () => {
                contract.off('UserVerified', onUserVerified);
                contract.off('AccessGranted', onAccessGranted);
                contract.off('OrderStatusUpdated', onOrderStatus);
            };
        }
    }, [contract, user.aadhar]);


    // Fetch Orders when entering Receive View
    useEffect(() => {
        if (view === 'RECEIVE_FLOW' && contract) {
            const fetchOrders = async () => {
                setLoadingOrders(true);
                try {
                    const orders = await contract.getOrders();
                    // Filter for my email and pending status
                    // Note: contract orders are struct arrays.
                    const myOrders = orders
                        .filter(o => o.receiverEmail === user.email && (o.status === 'IN_TRANSIT' || o.status === 'DELIVERED'))
                        .map(o => ({
                            id: o.id,
                            description: o.description,
                            senderAadhar: o.senderAadhar,
                            status: o.status,
                            deliveryTimestamp: o.deliveryTimestamp
                        }));

                    // Sort: IN_TRANSIT first, then DELIVERED (newest first)
                    // Simple hack: Assume order IDs roughly correlate or just reverse
                    const pending = myOrders.filter(o => o.status === 'IN_TRANSIT');
                    const recentDelivered = myOrders.filter(o => o.status === 'DELIVERED').slice(-3); // Show last 3 delivered

                    setIncomingOrders([...pending, ...recentDelivered]);
                } catch (err) {
                    console.error("Fetch Orders Failed", err);
                } finally {
                    setLoadingOrders(false);
                }
            };
            fetchOrders();
        }
    }, [view, contract, user.email]);


    const handleAddressSubmit = async () => {
        if (!contract) return;
        try {
            console.log("Creating Order on Blockchain...");
            // Generate Random Order ID
            const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);

            const tx = await contract.createOrder(
                orderId,
                user.aadhar,
                receiverData.mobile || '0000000000',
                receiverData.email || 'receiver@example.com',
                receiverData.address,
                receiverData.description || 'Standard Post',
                receiverData.weight || '0.5'
            );
            await tx.wait();
            console.log("Order Created on Chain:", orderId);

            // Reset and Show Success (Maybe move to History)
            setLastCreatedOrderId(orderId);
            setOrderStatus('ORDER_SUCCESS');
            // alert(`Order Placed! ID: ${orderId}`); REMOVED as per request
        } catch (e) {
            console.error("Order Creation Failed:", e);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("ARE YOU SURE? This will permanently delete your account and you cannot undo this action.")) return;

        if (!contract) return;
        try {
            console.log("Deleting User Account:", user.aadhar);
            const tx = await contract.deleteUser(user.aadhar);
            await tx.wait();

            // Clear local storage
            localStorage.removeItem('user');
            // Redirect to Landing Page
            window.location.href = 'http://localhost:5170';
        } catch (e) {
            console.error("Delete Account Failed:", e);
            const errorMessage = (e.reason || e.message || JSON.stringify(e));

            // If the user doesn't exist on chain (e.g. after redeploy), just clear session
            if (errorMessage.includes("User not found")) {
                alert("Account already removed from Blockchain. Clearing local session.");
                localStorage.removeItem('user');
                window.location.href = 'http://localhost:5170';
                return;
            }

            // Show detailed error for other cases
            alert("Failed to delete account!\n\nReason: " + errorMessage);
        }
    };

    return (
        <div className="min-h-screen p-4 font-sans text-slate-900 relative">

            {/* DELETE ACCOUNT BUTTON - Fixed Bottom Left */}
            <button
                onClick={handleDeleteAccount}
                className="fixed bottom-4 left-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs px-4 py-2 rounded shadow-lg z-50 transition-all border-2 border-red-900"
            >
                DELETE ACCOUNT
            </button>

            {/* Nav Header */}


            <main className="max-w-7xl mx-auto flex justify-center items-center min-h-[calc(100vh-100px)]">
                {view === 'MAIN' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        columnGap: '2rem',
                        rowGap: '2rem',
                        width: '100%',
                        maxWidth: '900px',
                        margin: '0 auto',
                        padding: '1rem',
                        justifyItems: 'center'
                    }}>
                        <div style={{ width: '100%' }}>
                            <Card
                                icon={<Send size={32} className="text-blue-600" />}
                                title="Send Post"
                                desc="Dispatch generic items."
                                onClick={() => setView('SEND_FLOW')}
                            />
                        </div>
                        <div style={{ width: '100%' }}>
                            <Card
                                icon={<Package size={32} className="text-blue-600" />}
                                title="Receive Post"
                                desc="Collect your deliveries."
                                onClick={() => setView('RECEIVE_FLOW')}
                            />
                        </div>
                        <div style={{ width: '100%' }}>
                            <Card
                                icon={<div className="text-blue-600 font-black text-2xl border-2 border-blue-600 rounded px-2">ID</div>}
                                title="Face ID Setup"
                                desc="Register verification."
                                onClick={() => window.location.href = '/face-setup'}
                            />
                        </div>
                        <div style={{ width: '100%' }}>
                            <Card
                                icon={<Clock size={32} className="text-blue-600" />}
                                title="History"
                                desc="View past transactions."
                                onClick={() => window.location.href = '/history'}
                            />
                        </div>
                    </div>
                )}
                {
                    view === 'SEND_FLOW' && (
                        <div className="glass-panel relative mx-auto flex flex-col justify-center items-center py-12" style={{ width: '700px', minHeight: '450px' }}>
                            <button
                                onClick={() => setView('MAIN')}
                                className="fixed top-28 left-8 text-sm font-bold uppercase tracking-wide text-black hover:underline border-2 border-black hover:bg-black hover:text-white px-3 py-1 rounded-lg transition z-[2000]"
                            >
                                BACK
                            </button>

                            <div className="mt-8 text-center w-full">


                                {orderStatus === 'IDLE' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div className="p-8 border-2 border-dashed border-black rounded-xl mb-8 bg-white max-w-md mx-auto">
                                            <h3 className="text-lg mb-2">Visit Controller Counter</h3>
                                            <p className="text-sm text-slate-600 font-bold">The agent will verify your identity via Face Scan. Once scanned, an OTP will appear here.</p>
                                        </div>
                                        <div className="animate-pulse font-bold text-blue-600 px-4 py-2 border border-blue-200 rounded-lg inline-block">Waiting for Controller...</div>
                                    </motion.div>
                                )}

                                {orderStatus === 'OTP_RECEIVED' && (
                                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                                        <h3 className="text-lg mb-4">Share this OTP</h3>
                                        <div className="mb-8">
                                            <OtpDisplay otp={currentOtp} />
                                        </div>
                                        <div className="text-xs text-red-600 font-bold uppercase tracking-wide">Expires in 5:00</div>
                                    </motion.div>
                                )}

                                {orderStatus === 'FORM_INPUT' && (
                                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                                        <h3 className="text-xl mb-6 text-blue-600 font-black flex items-center justify-center gap-2 uppercase tracking-tight">
                                            <CheckCircle size={24} strokeWidth={3} /> Identity Verified
                                        </h3>
                                        <div className="space-y-4 max-w-lg mx-auto px-8">
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
                                            <Input
                                                placeholder="Receiver Email"
                                                value={receiverData.email || ''}
                                                onChange={(e) => setReceiverData({ ...receiverData, email: e.target.value })}
                                            />
                                            <div className="flex gap-4 mt-6">
                                                <button
                                                    onClick={() => { setView('MAIN'); setOrderStatus('IDLE'); }}
                                                    className="flex-1 py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all bg-white hover:bg-slate-100 text-black border-2 border-black"
                                                >
                                                    Cancel
                                                </button>
                                                <div className="flex-1">
                                                    <Button onClick={handleAddressSubmit} className="btn-primary">Confirm Order</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {orderStatus === 'ORDER_SUCCESS' && (
                                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="py-8">
                                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black">
                                            <CheckCircle size={40} className="text-blue-600" />
                                        </div>
                                        <h3 className="text-2xl font-black text-black mb-2 uppercase italic">Order Confirmed!</h3>

                                        <div className="bg-white p-6 rounded-xl border-2 border-black mb-8 max-w-sm mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">ORDER ID</p>
                                            <p className="text-2xl font-mono text-black select-all font-black tracking-wider">{lastCreatedOrderId}</p>
                                        </div>

                                        <div className="flex gap-4 justify-center">
                                            <button
                                                onClick={() => { setView('MAIN'); setOrderStatus('IDLE'); }}
                                                className="text-slate-500 hover:text-black transition text-sm font-bold uppercase tracking-wide"
                                            >
                                                Back to Home
                                            </button>
                                            <button
                                                onClick={() => window.location.href = '/history'}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg transition font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide"
                                            >
                                                View History
                                            </button>
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
                                                <Truck size={64} className="text-black" />
                                            </motion.div>
                                        </div>
                                        <h3 className="text-3xl font-black uppercase text-black italic">
                                            Order is Travelling
                                        </h3>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )
                }

                {
                    view === 'RECEIVE_FLOW' && (
                        <div className="glass-panel relative min-h-[500px] text-center">
                            <button
                                onClick={() => setView('MAIN')}
                                className="fixed top-28 left-8 text-sm font-bold uppercase tracking-wide text-black hover:underline border-2 border-black hover:bg-black hover:text-white px-3 py-1 rounded-lg transition z-[2000]"
                            >
                                BACK
                            </button>
                            <h2 className="text-3xl font-black uppercase mb-8 mt-4 italic text-black">Incoming Packages</h2>

                            {loadingOrders ? (
                                <p className="animate-pulse font-bold text-slate-500">Scanning Ledger...</p>
                            ) : incomingOrders.length === 0 ? (
                                <p className="text-slate-400 font-bold py-12">No pending deliveries found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {incomingOrders.map(order => (
                                        <div key={order.id} className={`border-2 border-black p-4 flex flex-col items-start text-left rounded-xl transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${order.status === 'DELIVERED' ? 'bg-green-50/50' : 'bg-white hover:bg-slate-50'}`}>
                                            <div className="flex justify-between w-full mb-2">
                                                <span className="text-black font-black font-mono text-sm tracking-wide">ID: {order.id}</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider border ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>{order.status}</span>
                                            </div>
                                            <p className="text-lg text-black font-bold mb-1">{order.description}</p>
                                            <p className="text-xs text-slate-500 mb-4 font-bold">From: {order.senderAadhar}</p>

                                            {order.status === 'DELIVERED' ? (
                                                <div className="w-full bg-green-100 p-3 rounded-lg border border-green-300 text-center">
                                                    <p className="text-xs text-green-800 mb-1 uppercase font-extrabold tracking-widest flex items-center justify-center gap-2">
                                                        <CheckCircle size={16} strokeWidth={3} /> Successfully Delivered
                                                    </p>
                                                    <p className="text-sm text-green-700 font-bold mb-1">
                                                        Package Received
                                                    </p>
                                                    {order.deliveryTimestamp && order.deliveryTimestamp > 0 && (
                                                        <p className="text-xs text-green-600 font-mono font-bold tracking-wide">
                                                            {new Date(Number(order.deliveryTimestamp) * 1000).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-full bg-slate-50 p-3 rounded-lg border border-slate-300 text-center">
                                                    <p className="text-xs text-black mb-1 uppercase font-extrabold tracking-widest">Verification Required</p>
                                                    <p className="text-sm text-slate-600 font-bold">
                                                        Visit Controller & Scan Face to Receive
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
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
        whileHover={{ y: -5, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
        whileTap={{ y: 0, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
        onClick={onClick}
        className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer p-8 flex flex-col items-center text-center w-full"
    >
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-black uppercase text-black mb-2 tracking-tight">{title}</h3>
        <p className="text-slate-600 font-bold text-xs leading-tight">{desc}</p>
    </motion.div>
);

export default Dashboard;
