// user-client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Smartphone } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import * as faceapi from 'face-api.js';

const Login = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('SIGN_IN'); // SIGN_IN, SIGN_UP, OTP_VERIFY, SET_PASSWORD
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); // NEW state for inline messages

    // Form Data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        aadhar: '',
        mobile: '',
        otp: '',
        name: ''
    });

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'email') {
            value = value.toLowerCase().trim();
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- ACTIONS ---

    const handleSignIn = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const { getContract } = await import('../utils/blockchain');
            const contract = await getContract();

            const email = formData.email.trim();
            const password = formData.password;

            console.log("Attempting Blockchain Login:", { email, password }); // Log for debugging

            const [success, user] = await contract.login(email, password);

            if (success) {
                const userData = {
                    name: user.name,
                    mobile: user.mobile,
                    email: user.email,
                    aadhar: user.aadhar,
                    isController: user.isController
                };
                localStorage.setItem('user', JSON.stringify(userData));
                navigate('/dashboard');
            } else {
                setError('Invalid Email or Password');
            }
        } catch (err) {
            console.error(err);
            setError('Login Failed (Blockchain Error)');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUpRequest = async () => {
        // Validate Inputs
        if (!formData.email || !formData.aadhar || !formData.mobile) {
            setError("All fields required");
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // Request Email OTP from Backend
            const res = await axios.post('http://localhost:3001/api/auth/send-otp', { email: formData.email });
            setSuccess(res.data.message); // Inline Success instead of alert
            setTimeout(() => setMode('OTP_VERIFY'), 1000); // Auto transition
        } catch (err) {
            console.error("Full Login Error:", err);
            const msg = err.response?.data?.message || err.message || "Unknown Error";
            setError("Failed to send OTP. " + msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!formData.otp) {
            setError("Enter OTP");
            return;
        }

        try {
            // Verify OTP with Backend (Using Email)
            await axios.post('http://localhost:3001/api/auth/verify-otp', { email: formData.email, otp: formData.otp });
            setSuccess("OTP Verified!");
            setTimeout(() => setMode('FACE_CAPTURE'), 800);
        } catch (err) {
            setError("Invalid OTP");
        }
    };

    const handleRegister = async () => {
        if (!formData.password) {
            setError("Set a password");
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const { getContract } = await import('../utils/blockchain');
            const contract = await getContract();

            // Register on Blockchain
            console.log("Registering User to Chain:", {
                email: formData.email,
                password: formData.password,
                aadhar: formData.aadhar,
                mobile: formData.mobile
            });
            const tx = await contract.registerUser(
                formData.name || "New User",
                formData.mobile,
                formData.email,
                formData.password,
                formData.aadhar,
                formData.faceDescriptor || "[]",
                false
            );
            console.log("Transaction Sent:", tx.hash);
            await tx.wait();
            console.log("Transaction Mined");

            setSuccess("Registration Successful! Redirecting...");
            setTimeout(() => setMode('SIGN_IN'), 1500);
        } catch (err) {
            console.error("Registration Error", err);
            // Decode error if possible
            const reason = err.reason || err.message || "Unknown";
            if (reason.includes("User already registered")) {
                setError("User already registered");
            } else if (reason.includes("Email already used")) {
                setError("Email already used");
            } else {
                setError("Registration Failed: " + reason);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4 font-sans text-slate-900">
            <div className="w-full max-w-lg border-2 border-black p-12 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10">

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-black text-black uppercase tracking-tight">
                        User Portal
                    </h1>
                    <div className="h-1 w-16 bg-black mx-auto mt-2 rounded-full"></div>
                </div>

                {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-4 text-xs font-bold border border-red-200 text-center">{error}</div>}
                {success && <div className="bg-green-50 text-green-600 px-3 py-2 rounded-lg mb-4 text-xs font-bold border border-green-200 text-center">{success}</div>}

                <AnimatePresence mode='wait'>

                    {/* SIGN IN MODE */}
                    {mode === 'SIGN_IN' && (
                        <motion.div key="signin" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-black font-bold mb-1 block">Email Address</label>
                                <input name="email" placeholder="user@example.com" onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 outline-none focus:bg-blue-50 transition text-sm font-medium placeholder:text-slate-400" />
                            </div>
                            <div>
                                <label className="text-xs uppercase text-black font-bold mb-1 block">Password</label>
                                <input name="password" type="password" placeholder="••••••••" onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 outline-none focus:bg-blue-50 transition text-sm font-medium placeholder:text-slate-400" />
                            </div>

                            <button onClick={handleSignIn} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none transition-all text-sm">
                                {loading ? 'Validating...' : 'Sign In'}
                            </button>

                            <div className="text-center text-xs text-slate-600 mt-4 font-bold">
                                New User? <button onClick={() => setMode('SIGN_UP')} className="text-blue-600 hover:text-blue-800 underline">Create Account</button>
                            </div>
                        </motion.div>
                    )}

                    {/* SIGN UP - STEP 1 */}
                    {mode === 'SIGN_UP' && (
                        <motion.div key="signup" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                            <input name="name" placeholder="Full Name" onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 outline-none focus:bg-blue-50 transition text-sm font-medium" />
                            <input name="email" placeholder="Email Address" onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 outline-none focus:bg-blue-50 transition text-sm font-medium" />
                            <input name="aadhar" placeholder="Aadhar Number" onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 outline-none focus:bg-blue-50 transition text-sm font-medium" />
                            <input name="mobile" placeholder="Mobile Number" onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 outline-none focus:bg-blue-50 transition text-sm font-medium" />

                            <button onClick={handleSignUpRequest} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none transition-all text-sm">
                                {loading ? 'Sending OTP...' : 'Submit'}
                            </button>
                            <button onClick={() => setMode('SIGN_IN')} className="w-full text-slate-500 text-xs font-bold hover:text-black mt-2">Cancel</button>
                        </motion.div>
                    )}

                    {/* SIGN UP - STEP 2 (OTP) */}
                    {mode === 'OTP_VERIFY' && (
                        <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
                            <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200 mb-4">
                                <p className="text-blue-800 text-xs font-bold">OTP sent to {formData.email}</p>
                            </div>
                            <input name="otp" placeholder="XXXX" maxLength={4} onChange={handleChange} className="w-full text-center text-2xl tracking-[0.5rem] bg-white border-2 border-black rounded-lg px-3 py-2 outline-none focus:bg-blue-50 transition font-mono font-bold mb-2" />

                            <button onClick={handleVerifyOtp} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none transition-all text-sm">
                                Verify OTP
                            </button>
                        </motion.div>
                    )}

                    {/* SIGN UP - STEP 3 (FACE SCAN) */}
                    {mode === 'FACE_CAPTURE' && (
                        <motion.div key="face" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 text-center">
                            <h3 className="text-lg font-bold text-black mb-1 uppercase">Face ID Setup</h3>
                            <p className="text-xs text-slate-500 mb-3">Position your face clearly in the frame</p>

                            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-black shadow-md mx-auto">
                                <FaceScanner onScan={(desc) => {
                                    setFormData(prev => ({ ...prev, faceDescriptor: JSON.stringify(desc) }));
                                    setMode('SET_PASSWORD');
                                }} />
                            </div>
                            <div className="inline-block bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 animate-pulse">
                                ● LIVE
                            </div>
                        </motion.div>
                    )}

                    {/* SIGN UP - STEP 4 (PASSWORD) */}
                    {mode === 'SET_PASSWORD' && (
                        <motion.div key="pass" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
                            <h3 className="text-lg font-bold text-black mb-2 uppercase">Set Password</h3>
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                                <ShieldCheck size={32} className="text-black" />
                            </div>
                            <p className="text-xs text-black mb-4 font-bold bg-green-100 py-1 px-3 rounded border border-green-300 inline-block">Bio-metrics Captured!</p>
                            <input name="password" type="password" placeholder="Create Password" onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 outline-none focus:bg-blue-50 transition text-sm font-medium" />

                            <button onClick={handleRegister} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none transition-all text-sm">
                                {loading ? 'Registering...' : 'Complete Registration'}
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );

};

export default Login;

const FaceScanner = ({ onScan }) => {
    const videoRef = React.useRef();
    const [status, setStatus] = React.useState("Initializing...");
    const [isModelLoaded, setIsModelLoaded] = React.useState(false);
    const [isScanning, setIsScanning] = React.useState(false);

    React.useEffect(() => {
        const loadModels = async () => {
            console.log("Loading Face API Models...");
            setStatus("Loading AI Models...");
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                console.log("Models Loaded Successfully");
                setStatus("Models Loaded. Click Start.");
                setIsModelLoaded(true);
                startVideo();
            } catch (e) {
                console.error("Model Load Error", e);
                setStatus("Error Loading Models: " + e.message);
            }
        };
        loadModels();
    }, []);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                console.log("Camera Stream Acquired");
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error("Camera Error", err);
                setStatus("Camera Error: " + err.message);
            });
    };

    const startDetection = () => {
        setIsScanning(true);
        setStatus("Scanning... Hold Still");

        const interval = setInterval(async () => {
            if (videoRef.current) {
                try {
                    const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptor();

                    if (detection) {
                        console.log("Face Detected!", detection.descriptor.slice(0, 5));
                        setStatus("Face Captured!");

                        clearInterval(interval);
                        setIsScanning(false);

                        // Stop Camera Stream
                        const stream = videoRef.current.srcObject;
                        if (stream) {
                            stream.getTracks().forEach(track => track.stop());
                            videoRef.current.srcObject = null;
                        }

                        onScan(Array.from(detection.descriptor));
                    }
                } catch (err) {
                    console.error("Detection Error", err);
                }
            }
        }, 500);
    };

    return (
        <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay muted width="100%" height="100%" style={{ objectFit: 'cover' }} />

            {/* Status Overlay */}
            <div className="absolute top-2 left-0 w-full text-center">
                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    {status}
                </span>
            </div>

            {/* Start Scan Button */}
            {!isScanning && isModelLoaded && (
                <div className="absolute bottom-10 left-0 w-full flex justify-center z-10">
                    <button
                        onClick={startDetection}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-full shadow-lg transition transform hover:scale-105"
                    >
                        Start Scan
                    </button>
                </div>
            )}

            {/* Scanning Indicator */}
            {isScanning && (
                <div className="absolute inset-0 border-4 border-blue-500/50 rounded-xl animate-pulse pointer-events-none"></div>
            )}
        </div>
    );
};
