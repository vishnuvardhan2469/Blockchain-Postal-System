// user-client/src/components/ui/Input.jsx
import React from 'react';
import { motion } from 'framer-motion';

export const Input = ({ label, error, ...props }) => {
    return (
        <div className="input-group">
            <input
                className={`input-field ${error ? 'border-red-500' : ''}`}
                placeholder=" "
                {...props}
            />
            {label && <span className="absolute left-4 top-4 text-slate-400 transition-all pointer-events-none -translate-y-1/2 text-sm">{label}</span>}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
};
