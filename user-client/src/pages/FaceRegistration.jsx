import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import * as faceapi from 'face-api.js';

const FaceRegistration = () => {
    const webcamRef = useRef(null);
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState('Loading AI Models...');
    const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [modelsLoaded, setModelsLoaded] = useState(false);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
                setMessage('Position your face in the circle');
            } catch (err) {
                console.error("Model Load Error:", err);
                setMessage('Error loading AI models. Refresh page.');
            }
        };
        loadModels();
    }, []);

    const captureAndRegister = async () => {
        if (!modelsLoaded) return;
        setProcessing(true);
        setMessage('Scanning Face...');

        try {
            if (!webcamRef.current || !webcamRef.current.video) {
                throw new Error("Camera not ready");
            }

            const video = webcamRef.current.video;

            // Detect Face
            const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                setMessage('No face detected. Stay still and try again.');
                setProcessing(false);
                return;
            }

            // Convert Float32Array to regular array for JSON serialization
            const descriptorArray = Array.from(detection.descriptor);
            const descriptorJson = JSON.stringify(descriptorArray);

            // BLOCKCHAIN: Save to Smart Contract
            const { getContract, parseError } = await import('../utils/blockchain');
            const contract = await getContract();

            if (!contract) throw new Error("Could not connect to Blockchain");

            console.log("Saving face to blockchain...");

            // Check if user exists to decide between register or update
            const existingUser = await contract.getUser(user.aadhar);

            if (existingUser && existingUser.isRegistered) {
                const tx = await contract.updateFaceDescriptor(user.aadhar, descriptorJson);
                await tx.wait();
                console.log("Updated existing user face");
            } else {
                // If user doesn't exist on chain, register them fully
                // (Assumes we have name/mobile from localStorage or defaults)
                const tx = await contract.registerUser(
                    user.name || "Unknown User",
                    user.mobile || "0000000000",
                    user.aadhar,
                    descriptorJson,
                    false
                );
                await tx.wait();
                console.log("Registered new user face");
            }

            setMessage('Face Registered on Blockchain!');
            setTimeout(() => navigate('/dashboard'), 1500);

        } catch (err) {
            console.error("Registration Error:", err);
            // const { parseError } = await import('../utils/blockchain'); // Lazy import if needed or move top
            setMessage(`Registration failed: ${err.message}`);
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4">
            {/* Fixed Back Button */}
            <button
                onClick={() => navigate('/dashboard')}
                className="fixed top-28 left-8 text-sm font-bold uppercase tracking-wide text-black hover:underline border-2 border-black hover:bg-black hover:text-white px-3 py-1 rounded-lg transition z-[2000]"
            >
                BACK
            </button>

            <div className="glass-panel text-center max-w-md p-8">
                <h1 className="text-3xl font-black uppercase text-black italic tracking-tighter mb-2">Face ID Setup</h1>
                <div className="h-1 w-20 bg-black mx-auto mb-8 rounded-full"></div>

                <div className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8 bg-black mx-auto">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror mode
                        videoConstraints={{
                            width: 640,
                            height: 480,
                            facingMode: "user"
                        }}
                    />

                    {/* Scanning Overlay */}
                    <motion.div
                        className="absolute top-0 left-0 w-full h-1 bg-blue-500"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                </div>

                <p className="text-black mb-8 text-sm font-bold bg-blue-50 inline-block px-4 py-2 rounded-lg border-2 border-black uppercase tracking-wide">{message}</p>

                <div className="flex gap-4 justify-center w-full">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 py-3 rounded-lg font-bold transition border-2 border-black hover:bg-slate-100 text-black uppercase tracking-wide text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={captureAndRegister}
                        disabled={!modelsLoaded || processing}
                        className={`flex-1 py-3 rounded-lg font-bold transition border-2 border-black uppercase tracking-wide text-sm ${(!modelsLoaded || processing)
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                    >
                        {processing ? 'Registering...' : (modelsLoaded ? 'Scan Face' : 'Loading...')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FaceRegistration;
