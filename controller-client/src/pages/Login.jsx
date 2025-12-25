// controller-client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Creds, 2: OTP
    const [creds, setCreds] = useState({ email: 'vishnuvardhanchinni14@gmail.com', password: '' });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            // BLOCKCHAIN AUTH
            const { getContract } = await import('../utils/blockchain');
            const contract = await getContract();
            if (!contract) throw new Error("Blockchain disconnected");

            // Check Email/Pass on Chain
            const [success, user] = await contract.login(creds.email, creds.password);

            if (success && user.isController) {
                console.log("Creds Valid. Requesting OTP...");
                // REQUEST REAL OTP FROM BACKEND (Sends User Email)
                const { default: axios } = await import('axios');
                await axios.post('http://localhost:3001/api/auth/send-otp', { email: creds.email });

                setStep(2);
            } else {
                setError('Invalid Email or Password (or not a Controller)');
            }

        } catch (err) {
            console.error(err);
            setError('Login Check Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setError('');
        try {
            const { default: axios } = await import('axios');
            const res = await axios.post('http://localhost:3001/api/auth/verify-otp', { email: creds.email, otp });

            if (res.data.success) {
                localStorage.setItem('controllerToken', 'secure-token');
                navigate('/dashboard');
            } else {
                setError('Invalid OTP');
            }
        } catch (err) {
            console.error(err);
            setError('Invalid OTP or Server Error');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4 font-sans text-slate-900">
            <div className="w-full max-w-md bg-white border-4 border-black p-10 rounded-[2.5rem] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative z-10 flex flex-col justify-center min-h-[500px]">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-black uppercase tracking-tight">ADMIN CONTROL</h1>
                    <div className="h-1 w-16 bg-black mx-auto mt-2 rounded-full"></div>
                    <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wide">Secure Blockchain Access</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-4 text-xs font-bold border border-red-200 text-center border-l-4 border-l-red-600">{error}</div>}

                {step === 1 ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs uppercase text-black font-bold mb-1 block">Email ID</label>
                            <input
                                className="input-field"
                                value={creds.email}
                                onChange={e => setCreds({ ...creds, email: e.target.value })}
                                placeholder="admin@post.com"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase text-black font-bold mb-1 block">Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={creds.password}
                                onChange={e => setCreds({ ...creds, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleLogin}
                            disabled={loading}
                        >
                            {loading ? 'CHECKING LEDGER...' : 'REQUEST ACCESS'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in text-center">
                        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 text-xs font-bold uppercase tracking-wide">
                            OTP sent to email
                        </div>
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 text-xs font-bold uppercase tracking-wide break-all">
                            OTP sent to {creds.email}
                        </div>

                        <div className="py-4">
                            <input
                                className="w-full text-center text-3xl font-mono font-bold tracking-[1em] py-3 bg-white border-2 border-black rounded-lg outline-none focus:bg-slate-50 transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] placeholder:text-slate-300 placeholder:tracking-[0.5em]"
                                placeholder="XXXX"
                                value={otp}
                                maxLength={4}
                                onChange={e => setOtp(e.target.value)}
                            />
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleVerifyOtp}
                        >
                            VERIFY OTP
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
