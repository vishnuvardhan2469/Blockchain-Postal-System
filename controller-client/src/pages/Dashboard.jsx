// controller-client/src/pages/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, PackageCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const navigate = useNavigate();

    return (

        <div className="min-h-screen p-4 font-sans text-slate-900">
            {/* Header */}
            {/* Header */}

            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
                <h1 className="font-black text-black mb-8 tracking-[0.2em] uppercase text-sm bg-blue-50 px-4 py-2 rounded-full border border-blue-200">Select Operation</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4">
                    <MenuOption
                        icon={<Truck size={48} className="text-black mb-4" />}
                        title="SENDER"
                        desc="Process new shipment."
                        onClick={() => navigate('/verify/send')}
                    />

                    <MenuOption
                        icon={<PackageCheck size={48} className="text-blue-600 mb-4" />}
                        title="RECEIVER"
                        desc="Confirm delivery."
                        onClick={() => navigate('/verify/receive')}
                    />
                </div>
            </div>
        </div>
    );
};

const MenuOption = ({ icon, title, desc, onClick }) => (
    <motion.div
        whileHover={{ y: -5, boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)" }}
        whileTap={{ y: 0, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
        onClick={onClick}
        className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer p-6 flex flex-col items-center text-center w-full min-h-[200px] justify-center"
    >
        <div className="mb-4 text-black">{icon}</div>
        <h2 className="text-2xl font-black text-black mb-2 uppercase italic tracking-tight">{title}</h2>
        <p className="text-slate-600 font-bold text-sm tracking-wide">{desc}</p>
    </motion.div>
);

export default Dashboard;
