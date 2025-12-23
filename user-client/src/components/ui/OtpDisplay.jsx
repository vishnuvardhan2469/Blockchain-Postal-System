
import React from 'react';
import { motion } from 'framer-motion';

const OtpDisplay = ({ otp }) => {
    if (!otp) return null;
    const digits = otp.toString().split('');

    return (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            {digits.map((digit, index) => (
                <motion.div
                    key={index}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        border: '4px solid #000000',
                        borderRadius: '0.5rem',

                        background: 'rgba(255, 255, 255, 0.9)',
                        fontFamily: 'sans-serif',
                        fontWeight: 'bold',
                        color: '#000000',
                    }}
                >
                    {digit}
                </motion.div>
            ))}
        </div>
    );
};

export default OtpDisplay;
