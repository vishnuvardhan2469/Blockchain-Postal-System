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

            // Send real descriptor to backend
            await axios.post('http://localhost:3001/api/user/register-face', {
                aadhar: user.aadhar,
                descriptor: descriptorArray
            });

            setMessage('Face Registered Successfully!');
            setTimeout(() => navigate('/dashboard'), 1500);

        } catch (err) {
            console.error("Registration Error:", err);
            setMessage('Registration failed. Try again.');
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold text-white mb-8 font-['Orbitron'] tracking-wider">FACE ID SETUP</h1>

            <div className="relative w-80 h-80 rounded-full overflow-hidden border-4 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.5)] mb-8 bg-black">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror mode
                    videoConstraints={{
                        width: 480,
                        height: 480,
                        facingMode: "user"
                    }}
                />

                {/* Scanning Overlay */}
                <motion.div
                    className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_20px_#3b82f6]"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
            </div>

            <p className="text-blue-300 mb-8 text-lg font-mono">{message}</p>

            <div className="flex gap-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition"
                >
                    CANCEL
                </button>
                <button
                    onClick={captureAndRegister}
                    disabled={!modelsLoaded || processing}
                    className={`px-8 py-3 rounded-xl font-bold transition ${(!modelsLoaded || processing)
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30'
                        }`}
                >
                    {processing ? 'REGISTERING...' : (modelsLoaded ? 'REGISTER FACE' : 'LOADING...')}
                </button>
            </div>
        </div>
    );
};

export default FaceRegistration;
