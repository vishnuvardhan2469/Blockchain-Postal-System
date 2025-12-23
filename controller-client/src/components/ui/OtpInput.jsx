
import React, { useRef, useEffect } from 'react';

const OtpInput = ({ length = 4, value, onChange }) => {
    const inputs = useRef([]);

    useEffect(() => {
        if (inputs.current[0]) {
            inputs.current[0].focus();
        }
    }, []);

    const handleChange = (e, index) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newOtp = value.split('');
        newOtp[index] = val.substring(val.length - 1);
        const combined = newOtp.join('');
        onChange(combined);

        // Move to next
        if (val && index < length - 1 && inputs.current[index + 1]) {
            inputs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !value[index] && index > 0 && inputs.current[index - 1]) {
            inputs.current[index - 1].focus();
        }
    };

    // Generate boxes
    const boxes = [];
    for (let i = 0; i < length; i++) {
        boxes.push(
            <input
                key={i}
                type="text"
                maxLength={1}
                ref={(el) => (inputs.current[i] = el)}
                value={value[i] || ''}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="otp-box"
                style={{
                    width: '36px',
                    height: '36px',
                    fontSize: '1.25rem',
                    textAlign: 'center',
                    border: '4px solid #000000',
                    borderRadius: '0.5rem',

                    background: 'rgba(255, 255, 255, 0.8)',
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    color: '#000000',
                    outline: 'none'
                }}
            />
        );
    }

    return (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            {boxes}
        </div>
    );
};

export default OtpInput;
