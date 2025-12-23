// controller-client/src/pages/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, PackageCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4">
            <h1 className="font-bold text-slate-400 mb-12 tracking-[0.5em] uppercase" style={{ fontSize: '14px' }}>SELECT OPERATION</h1>

            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '150px', width: '100%' }}>
                <div style={{ width: '300px' }}>
                    <MenuOption
                        icon={<Truck size={48} className="text-emerald-400 mb-4" />}
                        title="SENDER"
                        desc="Process new shipment."
                        onClick={() => navigate('/verify/SEND')}
                    />
                </div>

                <div style={{ width: '300px' }}>
                    <MenuOption
                        icon={<PackageCheck size={48} className="text-blue-400 mb-4" />}
                        title="RECEIVER"
                        desc="Confirm delivery."
                        onClick={() => navigate('/verify/RECEIVE')}
                    />
                </div>
            </div>

            <button
                onClick={() => navigate('/login')}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    zIndex: 1000,
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontSize: '0.8rem'
                }}
                className="hover:bg-white/10 transition-colors"
            >
                Logout
            </button>
        </div>
    );
};

const MenuOption = ({ icon, title, desc, onClick }) => (
    <motion.div
        whileHover={{ scale: 1.05, borderColor: '#10b981' }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="glass-panel flex flex-col items-center text-center cursor-pointer transition-colors justify-center group"
        style={{
            padding: '2rem',
            width: '100%',
            margin: 0,
            border: '4px solid #000000',
            boxShadow: '8px 8px 0px #000000',
            borderRadius: '2rem'
        }}
    >
        <div className="group-hover:scale-110 transition-transform duration-300">{icon}</div>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 text-sm">{desc}</p>
    </motion.div>
);

export default Dashboard;
