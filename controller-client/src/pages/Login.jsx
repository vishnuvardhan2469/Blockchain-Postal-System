// controller-client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Creds, 2: OTP
    const [creds, setCreds] = useState({ email: 'vishnuvardhanchinni14@gmail.com', password: '' });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        console.log("Attempting login with:", creds);
        try {
            const res = await axios.post('http://localhost:3001/api/controller/login', creds);
            console.log("Login response:", res.data);
            if (res.data.success) {
                setStep(2);
            } else {
                console.error("Login success false", res.data);
                setError(res.data.message || "Login failed");
            }
        } catch (err) {
            console.error("Login Error:", err);
            // Show detailed error to user for debugging
            alert(`Login Error: ${err.message}\n${err.response?.data?.message || ''}`);
            setError('Invalid credentials or Server Error');
        }
    };

    const handleVerify = async () => {
        try {
            const res = await axios.post('http://localhost:3001/api/controller/verify-login-otp', { email: creds.email, otp });
            if (res.data.success) {
                localStorage.setItem('controllerToken', res.data.token);
                navigate('/dashboard');
            }
        } catch (err) {
            setError('Invalid OTP');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass-panel p-8 w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-wider">ADMIN CONTROL</h1>
                    <div className="h-1 w-20 bg-emerald-500 mx-auto mt-2 rounded"></div>
                </div>

                {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

                {step === 1 ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs uppercase text-slate-500 font-bold mb-1 block">Email</label>
                            <input
                                className="input-field"
                                value={creds.email}
                                onChange={e => setCreds({ ...creds, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase text-slate-500 font-bold mb-1 block">Password</label>
                            <input
                                className="input-field"
                                type="password"
                                value={creds.password}
                                onChange={e => setCreds({ ...creds, password: e.target.value })}
                            />
                        </div>
                        <button className="btn-primary" onClick={handleLogin}>Access Request</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-slate-400 text-sm text-center">Enter OTP sent to registered email.</p>
                        <input
                            className="input-field text-center text-2xl tracking-widest"
                            placeholder="0000"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                        />
                        <button className="btn-primary" onClick={handleVerify}>Verify Access</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
