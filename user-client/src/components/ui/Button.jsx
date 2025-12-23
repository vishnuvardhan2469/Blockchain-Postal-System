// user-client/src/components/ui/Button.jsx
import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({ children, loading, ...props }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`btn-primary ${loading ? 'opacity-70 cursor-wait' : ''}`}
            disabled={loading}
            {...props}
        >
            {loading ? 'Processing...' : children}
        </motion.button>
    );
};
