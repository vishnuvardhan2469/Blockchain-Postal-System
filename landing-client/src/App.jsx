import React from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, ArrowRight } from 'lucide-react';

function App() {
    // Force Refresh
    const gotoUser = () => {
        window.location.href = 'http://localhost:5173';
    };

    const gotoController = () => {
        window.location.href = 'http://localhost:5174';
    };

    return (
        <>
            <div className="main-header">SECURE DELIVERY PORTAL</div>

            {/* Aurora Background */}
            <div className="aurora-bg">
                <div className="aurora-blob blob-1"></div>
                <div className="aurora-blob blob-2"></div>
                <div className="aurora-blob blob-3"></div>
            </div>

            {/* Force Flex Row with inline styles to override any missing Tailwind config */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2rem',
                width: '100%',
                maxWidth: '900px',
                padding: '0 1rem',
                zIndex: 10
            }}>

                {/* Controller Card */}
                <motion.div
                    whileHover={{ scale: 1.05, translateY: -10 }}
                    style={{ width: '280px', height: '280px' }}
                    className="glass-panel flex flex-col items-center justify-center text-center cursor-pointer group border-black"
                    onClick={gotoController}
                >
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 border-4 border-slate-900 group-hover:shadow-[0_0_30px_#0f172a] transition-all">
                        <ShieldCheck size={40} className="text-green-400" />
                    </div>
                    <h2 className="text-2xl font-black mb-2 italic tracking-tighter">CONTROLLER</h2>

                    <div className="flex items-center gap-2 text-slate-900 font-bold tracking-widest group-hover:gap-4 transition-all text-sm mt-4">
                        ACCESS PANEL <ArrowRight size={16} />
                    </div>
                </motion.div>

                {/* User Card */}
                <motion.div
                    whileHover={{ scale: 1.05, translateY: -10 }}
                    style={{ width: '280px', height: '280px' }}
                    className="glass-panel flex flex-col items-center justify-center text-center cursor-pointer group"
                    onClick={gotoUser}
                >
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4 border-4 border-blue-500 group-hover:shadow-[0_0_30px_#3b82f6] transition-all">
                        <User size={40} className="text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black mb-2 italic tracking-tighter">USER PORTAL</h2>

                    <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest group-hover:gap-4 transition-all text-sm mt-4">
                        ENTER PORTAL <ArrowRight size={16} />
                    </div>
                </motion.div>

            </div>
        </>
    );
}

export default App;
