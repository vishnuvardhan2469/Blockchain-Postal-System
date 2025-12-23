// user-client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FaceRegistration from './pages/FaceRegistration';
import History from './pages/History';
// import { AuthProvider } from './context/AuthContext'; // To be implemented

function App() {
  return (
    <BrowserRouter>
      {/* Background & Header */}
      <div className="gen-z-header">GEN-Z POSTAL SERVICES</div>
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>

      <div className="app-container relative z-10">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/face-setup" element={<FaceRegistration />} />
          <Route path="/history" element={<History />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>

      <ContactFeature />
    </BrowserRouter>
  );
}

// Inline Contact Feature Component
import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

const ContactFeature = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [complaint, setComplaint] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!complaint.trim()) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      await axios.post('http://localhost:3001/api/user/complaint', {
        mobile: user.mobile || 'Anonymous',
        complaint
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setComplaint('');
        setIsOpen(false);
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Circular Floating Button - Top Right */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-50 w-14 h-14 bg-blue-600 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-500 transition-all hover:scale-110"
        style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}
        title="Contact Us"
      >
        <MessageCircle size={24} />
      </button>

      {/* Complaint Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative text-slate-100">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageCircle size={20} className="text-blue-400" />
              Complaint Sheet
            </h3>

            {submitted ? (
              <div className="text-center py-8 text-green-400">
                <p className="font-bold text-lg">Complaint Submitted!</p>
                <p className="text-sm text-slate-400">We will get back to you soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">Please describe your issue below:</p>
                <textarea
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Write your complaint here..."
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                />
                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Submit Complaint
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default App;
