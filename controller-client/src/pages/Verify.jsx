// controller-client/src/pages/Verify.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Scan, UserCheck, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import OtpInput from '../components/ui/OtpInput';

const Verify = () => {
    const { type } = useParams(); // SEND or RECEIVE
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    // Steps: 1: Aadhar, 2: Face Scan, 3: OTP, 4: Success
    const [step, setStep] = useState(1);
    const [aadhar, setAadhar] = useState('');
    const [targetDescriptor, setTargetDescriptor] = useState(null);
    const [transactionId, setTransactionId] = useState(null);
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [scanMessage, setScanMessage] = useState('Initializing Face AI...');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // Upload State
    const [useCamera, setUseCamera] = useState(true);
    const [uploadedImage, setUploadedImage] = useState(null);
    const imgRef = useRef(null);

    // Load Models on Mount
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (err) {
                console.error("Failed to load models", err);
                setError("Failed to load AI models");
            }
        };
        loadModels();
    }, []);

    // Step 1: Verify Aadhar & Get Descriptor
    const handleAadharSubmit = async () => {
        if (aadhar.length !== 16) {
            setError('Aadhar must be 16 digits');
            return;
        }
        setError('');
        try {
            // Check availability and get descriptor
            const res = await axios.post('http://localhost:3001/api/user/get-face-descriptor', { aadhar });
            if (res.data.success && res.data.descriptor) {
                setTargetDescriptor(new Float32Array(res.data.descriptor)); // Convert back to typed array
                setStep(2);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                // Fallback for prototype: If user has no face registered, warn but maybe allow bypass or Mock?
                // For "Specific" request, we enforce it.
                setError('User not found or Face ID not registered. Please register in User App.');
            } else {
                setError('Connection failed');
            }
        }
    };


    // Step 2: Real Face Verification Logic
    const startScanning = async (e) => {
        setIsScanning(true);
        setScanMessage('Scanning Biometrics...');
        setError('');

        if (!modelsLoaded) {
            setError("AI Models not loaded. Please refresh.");
            setIsScanning(false);
            return;
        }

        try {
            if (!webcamRef.current || !webcamRef.current.video) {
                throw new Error("Camera not ready");
            }

            const video = webcamRef.current.video;

            // 1. Detect Face
            const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                setScanMessage('No face detected. Keep still.');
                // Retry loop could be added here, but for now we stop
                setTimeout(() => setIsScanning(false), 2000);
                return;
            }

            // 2. Compare with Target
            if (targetDescriptor) {
                const distance = faceapi.euclideanDistance(detection.descriptor, targetDescriptor);
                console.log("Face Match Distance:", distance);

                // Threshold adjusted to 0.3 as requested by user
                if (distance < 0.3) {
                    setScanMessage(`MATCH CONFIRMED (Score: ${distance.toFixed(2)})`);
                    handleFaceSuccess();
                    setIsScanning(false); // Stop scanning UI
                } else {
                    setScanMessage(`MISMATCH (Score: ${distance.toFixed(2)}) - RETRYING`);
                    setError(`Biometric verification failed. Score: ${distance.toFixed(2)}`);
                    setTimeout(() => setIsScanning(false), 2000);
                }
            } else {
                setError("No reference face found for user.");
                setIsScanning(false);
            }

        } catch (err) {
            console.error("Verification Error:", err);
            setError("Scanner Error");
            setIsScanning(false);
        }
    };

    const handleFaceSuccess = async () => {
        // Generate Token/OTP flow
        try {
            const res = await axios.post('http://localhost:3001/api/transaction/generate-otp', {
                aadhar,
                type
            });
            if (res.data.success) {
                setTransactionId(res.data.transactionId);
                setTimeout(() => setStep(3), 1000); // Wait a bit to show success
            }
        } catch (err) {
            setError('Failed to generate OTP');
        }
    };

    // Step 3: OTP Verify
    const handleOtpVerify = async () => {
        try {
            setError('');
            const res = await axios.post('http://localhost:3001/api/transaction/verify-otp', {
                transactionId,
                otp
            });
            if (res.data.success) {
                setStep(4);
            }
        } catch (err) {
            setError('Incorrect OTP');
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-4 bg-slate-900 text-slate-100 font-sans">
            <button
                onClick={() => navigate('/dashboard')}
                className="fixed bottom-8 left-8 text-white border border-white/30 px-4 py-2 rounded hover:bg-white/10 transition z-50 text-xs tracking-widest"
            >
                BACK
            </button>

            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                {/* Progress Bar */}
                <div className="w-full h-1 bg-slate-800 mb-8 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-blue-500" animate={{ width: `${step * 25}%` }} />
                </div>

                <div className="glass-panel w-full p-8 min-h-[500px] flex flex-col items-center justify-center relative">
                    <AnimatePresence mode="wait">

                        {/* STEP 1: AADHAR */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-sm text-center">
                                <UserCheck size={64} className="text-blue-400 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold mb-2 font-['Orbitron']">IDENTITY CLAIM</h2>
                                <p className="text-slate-400 mb-8">Enter User's 16-digit Aadhar ID</p>
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-center text-xl tracking-[0.2em] focus:border-blue-500 outline-none transition mb-4"
                                    placeholder="0000 0000 0000 0000"
                                    value={aadhar}
                                    onChange={(e) => setAadhar(e.target.value)}
                                    maxLength={16}
                                />
                                {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
                                <button className="btn-primary" onClick={handleAadharSubmit}>VERIFY IDENTITY</button>
                            </motion.div>
                        )}

                        {/* STEP 2: FACE SCAN */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
                                {/* Toggle Switch */}
                                <div className="flex gap-4 mb-6 bg-slate-800 p-1 rounded-lg z-50 relative">
                                    <button
                                        onClick={() => { setIsScanning(false); setUseCamera(true); setUploadedImage(null); setError(''); }}
                                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${useCamera ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        CAMERA
                                    </button>
                                    <button
                                        onClick={() => { setIsScanning(false); setUseCamera(false); setError(''); }}
                                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${!useCamera ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        UPLOAD PHOTO
                                    </button>
                                </div>

                                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.5)] mb-6 bg-black flex items-center justify-center">
                                    {useCamera ? (
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover transform scale-x-[-1]"
                                        />
                                    ) : (
                                        uploadedImage ? (
                                            <img ref={imgRef} src={uploadedImage} alt="Upload" className="w-full h-full object-cover" />
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-blue-400 transition w-full h-full">
                                                <span className="text-4xl mb-2">📁</span>
                                                <span className="text-xs">Select Image</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                            </label>
                                        )
                                    )}

                                    {isScanning && (
                                        <motion.div
                                            className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_20px_#3b82f6]"
                                            animate={{ top: ['0%', '100%', '0%'] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        />
                                    )}
                                </div>
                                <h3 className="text-xl font-bold font-['Orbitron'] mb-2">{isScanning ? 'VERIFYING BIOMETRICS...' : 'READY TO SCAN'}</h3>
                                <p className="text-blue-300 font-mono text-sm mb-6">{scanMessage}</p>
                                {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

                                {!isScanning && (
                                    <button className="btn-primary max-w-xs" onClick={startScanning}>
                                        START SCAN
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {/* STEP 3: OTP */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm text-center">
                                <ShieldCheck size={64} className="text-green-400 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold mb-2 font-['Orbitron']">AUTHORIZATION</h2>
                                <p className="text-slate-400 mb-8">Enter OTP sent to User's Device</p>
                                <OtpInput length={4} value={otp} onChange={setOtp} />
                                {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
                                <button className="btn-primary absolute bottom-12 left-1/2 -translate-x-1/2 w-40 py-2 text-sm" onClick={handleOtpVerify}>AUTHENTICATE</button>
                            </motion.div>
                        )}

                        {/* STEP 4: SUCCESS */}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
                                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_#22c55e]">
                                    <Check size={48} className="text-black" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2 font-['Orbitron']">VERIFIED</h2>
                                <p className="text-slate-400 mb-8">Process Completed Successfully</p>
                                <button className="btn-primary" onClick={() => navigate('/dashboard')}>RETURN TO DASHBOARD</button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Verify;
