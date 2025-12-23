// user-client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Smartphone } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ mobile: '', aadhar: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleMobileSubmit = async () => {
        if (formData.mobile.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }
        setLoading(true);
        // Simulate checking if user exists (Optional, or just move to Aadhar)
        setTimeout(() => {
            setLoading(false);
            setStep(2);
        }, 800);
    };

    const handleAadharSubmit = async () => {
        if (formData.aadhar.length !== 16) {
            setError('Please enter a valid 16-digit Aadhar number');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:3001/api/user/login', formData);
            if (res.data.success) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            // Shake effect logic could be handled by parent state passed to visual wrapper
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-[url('/bg-pattern.svg')] bg-cover items-center justify-center min-h-screen p-4">
            <div className="glass-panel p-8 w-full max-w-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-violet-500"></div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center mb-8"
                >
                    <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
                        {step === 1 ? <Smartphone size={32} className="text-blue-400" /> : <ShieldCheck size={32} className="text-violet-400" />}
                    </div>
                    <h1 className="heading-xl text-3xl">Welcome Back</h1>
                    <p className="text-slate-400">Secure Post Delivery System</p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                        >
                            <Input
                                name="mobile"
                                placeholder="Mobile Number"
                                value={formData.mobile}
                                onChange={handleChange}
                                error={error}
                            />
                            <Button onClick={handleMobileSubmit} loading={loading}>
                                Continue
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                        >
                            <Input
                                name="aadhar"
                                placeholder="Aadhar Number (16 digits)"
                                value={formData.aadhar}
                                onChange={handleChange}
                                error={error}
                                type="password"
                            />
                            <Button onClick={handleAadharSubmit} loading={loading}>
                                Verify Identity
                            </Button>
                            <button
                                onClick={() => setStep(1)}
                                className="w-full mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                Back to Mobile Number
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Login;
