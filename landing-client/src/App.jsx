import React from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, ArrowRight } from 'lucide-react';

function App() {
    const gotoUser = () => {
        window.location.href = 'http://localhost:5173';
    };

    const gotoController = () => {
        window.location.href = 'http://localhost:5174';
    };

    return (
        <>
            <div className="gen-z-header">SECURE DELIVERY PORTAL</div>

            {/* Aurora Background */}
            <div className="aurora-bg">
                <div className="aurora-blob blob-1"></div>
                <div className="aurora-blob blob-2"></div>
                <div className="aurora-blob blob-3"></div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full max-w-6xl px-4 z-10">

                {/* User Card */}
                <motion.div
                    whileHover={{ scale: 1.05, translateY: -10 }}
                    className="glass-panel w-full md:w-1/2 min-h-[400px] flex flex-col items-center justify-center text-center cursor-pointer group"
                    onClick={gotoUser}
                >
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-6 border-4 border-blue-500 group-hover:shadow-[0_0_30px_#3b82f6] transition-all">
                        <User size={48} className="text-blue-600" />
                    </div>
                    <h2 className="text-4xl font-bold font-['Orbitron'] mb-4">USER PORTAL</h2>
                    <p className="text-slate-500 mb-8 max-w-xs text-lg">
                        Register your ID, set up facial recognition, and track your incoming secure deliveries.
                    </p>
                    <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest group-hover:gap-4 transition-all">
                        ENTER PORTAL <ArrowRight />
                    </div>
                </motion.div>

                {/* Controller Card */}
                <motion.div
                    whileHover={{ scale: 1.05, translateY: -10 }}
                    className="glass-panel w-full md:w-1/2 min-h-[400px] flex flex-col items-center justify-center text-center cursor-pointer group border-black"
                    onClick={gotoController}
                >
                    <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6 border-4 border-slate-900 group-hover:shadow-[0_0_30px_#0f172a] transition-all">
                        <ShieldCheck size={48} className="text-green-400" />
                    </div>
                    <h2 className="text-4xl font-bold font-['Orbitron'] mb-4">CONTROLLER</h2>
                    <p className="text-slate-500 mb-8 max-w-xs text-lg">
                        Admin access to verify identities, generating OTPs, and manage secure transactions.
                    </p>
                    <div className="flex items-center gap-2 text-slate-900 font-bold tracking-widest group-hover:gap-4 transition-all">
                        ACCESS PANEL <ArrowRight />
                    </div>
                </motion.div>

            </div>
        </>
    );
}

export default App;
