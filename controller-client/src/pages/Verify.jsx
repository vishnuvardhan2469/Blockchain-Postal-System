// controller-client/src/pages/Verify.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Scan, UserCheck, ShieldCheck, Check, AlertCircle, Package } from 'lucide-react';
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

    // Step 1: Verify Identity (Aadhar OR Order ID)
    const handleIdentitySubmit = async () => {
        setError('');
        try {
            const { getContract } = await import('../utils/blockchain');
            const contract = await getContract();
            if (!contract) throw new Error("Blockchain disconnected");

            if (type === 'send') {
                // --- SEND FLOW (Aadhar -> Face) ---
                if (aadhar.length !== 16) { setError('Aadhar must be 16 digits'); return; }

                const user = await contract.getUser(aadhar);
                if (user && user.isRegistered) {
                    if (user.faceDescriptor && user.faceDescriptor.length > 2) {
                        const descriptorArray = JSON.parse(user.faceDescriptor);
                        setTargetDescriptor(new Float32Array(descriptorArray));
                        setStep(2);
                    } else { setError('User registered but no face ID found.'); }
                } else { setError('User not found on Blockchain.'); }

            } else {
                // --- RECEIVE FLOW (Order ID -> Email -> Aadhar -> Face) ---
                if (!transactionId) { setError('Enter Order ID'); return; }

                console.log("Fetching Order:", transactionId);
                const order = await contract.ordersById(transactionId);

                if (!order || !order.receiverEmail) {
                    setError("Order not found or Invalid");
                    return;
                }
                if (order.status === 'DELIVERED') {
                    setError("Order already delivered!");
                    return;
                }

                console.log("Receiver Email:", order.receiverEmail);
                const receiverAadhar = await contract.emailToAadhar(order.receiverEmail);

                if (!receiverAadhar) {
                    setError("Receiver Email not linked to any User Aadhar");
                    return;
                }

                console.log("Receiver Aadhar:", receiverAadhar);
                const user = await contract.getUser(receiverAadhar);

                if (user && user.faceDescriptor && user.faceDescriptor.length > 2) {
                    const descriptorArray = JSON.parse(user.faceDescriptor);
                    setTargetDescriptor(new Float32Array(descriptorArray));
                    setStep(2); // Proceed to Face Scan
                } else {
                    setError('Receiver has not set up Face ID yet.');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Blockchain Lookup Failed');
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
        // BLOCKCHAIN: Signal Verification
        console.log("Face Verified. Processing...");
        try {
            const { getContract } = await import('../utils/blockchain');
            const contract = await getContract();

            if (contract) {
                if (type === 'receive') {
                    // --- RECEIVE FLOW: IMMEDIATE DELIVERY ---
                    console.log("Receiver Verified. Updating Status...");
                    const tx = await contract.updateOrderStatus(transactionId, "DELIVERED");
                    await tx.wait();
                    console.log("Order Delivered!");
                    setStep(4); // Success Loop
                } else {
                    // --- SEND FLOW: SIGNAL AND WAIT FOR OTP ---
                    // This triggers the User Dashboard to show the OTP
                    const tx = await contract.verifyUser(aadhar);
                    await tx.wait();
                    console.log("Verification Signaled. Waiting for OTP from User...");
                    setStep(3); // Move to OTP Input
                }
            }
        } catch (err) {
            console.error(err);
            setError('Failed to process transaction on-chain');
        }
    };

    // Step 3: OTP Verify & Grant Access
    const handleOtpVerify = async () => {
        if (otp.length !== 4) {
            setError("Enter 4-digit OTP provided by User");
            return;
        }

        // In this demo, we trust the Controller to enter the OTP the User gives them.
        setScanMessage("Processing...");
        try {
            const { getContract } = await import('../utils/blockchain');
            const contract = await getContract();

            if (contract) {
                if (type === 'send') {
                    // Send Flow: Authorize User Form
                    const tx = await contract.authorizeUser(aadhar);
                    await tx.wait();
                    console.log("Access Granted to User");
                } else {
                    // Receive Flow: Deliver Order
                    // transactionId is the Order ID entered in Step 1
                    if (!transactionId) {
                        setError("Transaction ID Missing");
                        return;
                    }
                    const tx = await contract.updateOrderStatus(transactionId, "DELIVERED");
                    await tx.wait();
                    console.log("Order Delivered");
                }
                setStep(4);
            }
        } catch (err) {
            console.error(err);
            setError("Action Failed on Blockchain");
        }
    };

    return (
        <div className="min-h-[calc(100vh-100px)] flex flex-col p-4 bg-white text-black font-sans">
            {/* Fixed Back Button */}
            <button
                onClick={() => navigate('/dashboard')}
                className="fixed top-28 left-8 text-sm font-bold uppercase tracking-wide text-black hover:underline border-2 border-black hover:bg-black hover:text-white px-3 py-1 rounded-lg transition z-[2000]"
            >
                BACK
            </button>

            <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full">
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 border-2 border-black mb-12 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-blue-600" animate={{ width: `${step * 25}%` }} />
                </div>

                <div className="glass-panel w-full p-6 min-h-[300px] flex flex-col items-center justify-center relative shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] rounded-[2.5rem] border-4 border-black">
                    <AnimatePresence mode="wait">

                        {/* === RECEIVE FLOW (DELIVERY) === */}
                        {type === 'receive' && step === 1 && (
                            <motion.div key="step1-rx" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-sm text-center">
                                <Package size={48} className="text-black mx-auto mb-4 transform scale-110" />
                                <h2 className="text-3xl font-black mb-2 italic tracking-tight uppercase">Delivery Protocol</h2>
                                <div className="h-1 w-20 bg-blue-600 mx-auto mb-4"></div>
                                <p className="text-slate-600 font-bold mb-6 text-sm">Enter Order ID to Deliver</p>
                                <input
                                    className="w-full bg-white border-4 border-black rounded-xl p-3 text-center text-lg font-black tracking-[0.1em] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition mb-4 uppercase placeholder:text-slate-300"
                                    placeholder="ORD-XXXX"
                                    value={transactionId || ''}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                />
                                {error && <div className="bg-red-50 text-red-600 border-l-4 border-red-600 px-4 py-2 mb-4 font-bold text-xs w-full">{error}</div>}
                                <button className="btn-primary py-3 text-base" onClick={handleIdentitySubmit}>VERIFY RECEIVER</button>
                            </motion.div>
                        )}

                        {/* === SEND FLOW (IDENTITY) === */}
                        {type === 'send' && step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-sm text-center">
                                <UserCheck size={48} className="text-blue-600 mx-auto mb-4 transform scale-110" />
                                <h2 className="text-3xl font-black mb-2 italic tracking-tight uppercase">Identity Claim</h2>
                                <div className="h-1 w-20 bg-blue-600 mx-auto mb-4"></div>
                                <p className="text-slate-600 font-bold mb-6 text-sm">Enter User's 16-digit Aadhar ID</p>
                                <input
                                    className="w-full bg-white border-4 border-black rounded-xl p-3 text-center text-lg font-black tracking-[0.2em] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition mb-4 placeholder:text-slate-300"
                                    placeholder="0000 0000 0000 0000"
                                    value={aadhar}
                                    onChange={(e) => setAadhar(e.target.value)}
                                    maxLength={16}
                                />
                                {error && <div className="bg-red-50 text-red-600 border-l-4 border-red-600 px-4 py-2 mb-4 font-bold text-xs w-full">{error}</div>}
                                <button className="btn-primary py-3 text-base" onClick={handleIdentitySubmit}>VERIFY IDENTITY</button>
                            </motion.div>
                        )}

                        {/* STEP 2: FACE SCAN (Send Only) */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
                                {/* Toggle Switch */}


                                <div className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] mb-8 bg-slate-100 flex items-center justify-center">
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
                                            <label className="cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition w-full h-full group">
                                                <span className="text-5xl mb-2 group-hover:scale-110 transition">📁</span>
                                                <span className="text-xs font-bold uppercase tracking-wide">Select Image</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                            </label>
                                        )
                                    )}

                                    {isScanning && (
                                        <motion.div
                                            className="absolute top-0 left-0 w-full h-2 bg-blue-500/80 shadow-[0_0_20px_#3b82f6]"
                                            animate={{ top: ['0%', '100%', '0%'] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        />
                                    )}
                                </div>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">{isScanning ? 'VERIFYING BIOMETRICS...' : 'READY TO SCAN'}</h3>
                                <p className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-md border border-blue-200 text-sm mb-6 uppercase tracking-wide">{scanMessage}</p>
                                {error && <div className="bg-red-50 text-red-600 border-l-4 border-red-600 px-4 py-2 mb-6 font-bold text-sm w-full text-center">{error}</div>}

                                {!isScanning && (
                                    <button className="btn-primary max-w-xs py-3 text-lg" onClick={startScanning}>
                                        START SCAN
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {/* STEP 3: OTP */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm text-center">
                                <ShieldCheck size={64} className="text-black mx-auto mb-6" />
                                <p className="text-slate-600 font-bold mb-8">Enter OTP sent to {type === 'send' ? "User" : "Receiver"}</p>

                                <div className="mb-8">
                                    <OtpInput length={4} value={otp} onChange={setOtp} />
                                </div>

                                {error && <div className="bg-red-50 text-red-600 border-l-4 border-red-600 px-4 py-2 mb-6 font-bold text-sm w-full">{error}</div>}
                                <button className="btn-primary w-full py-4 text-lg" onClick={handleOtpVerify}>
                                    {type === 'send' ? 'AUTHENTICATE' : 'CONFIRM DELIVERY'}
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 4: SUCCESS */}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
                                <div className="w-32 h-32 bg-green-100 border-4 border-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[8px_8px_0px_0px_#16a34a]">
                                    <Check size={64} className="text-green-600" strokeWidth={4} />
                                </div>
                                <h2 className="text-4xl font-black text-black mb-4 italic uppercase tracking-tighter">{type === 'send' ? 'VERIFIED' : 'DELIVERED'}</h2>
                                <p className="text-slate-600 font-bold mb-10 text-lg">{type === 'send' ? 'Identity Confirmed Successfully' : 'Package Handed Over Successfully'}</p>
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
