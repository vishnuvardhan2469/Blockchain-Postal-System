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
      <div className="main-header">SECURE POSTAL SERVICES</div>
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

      <LogoutButton />
      <UserNameDisplay />
      <ContactFeature />
    </BrowserRouter>
  );
}

// Global Logout Button
import { LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on login page
  if (location.pathname === '/login' || location.pathname === '/') return null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="fixed bottom-8 right-8 text-sm font-bold uppercase tracking-wide text-red-600 bg-white border-2 border-black hover:bg-black hover:text-red-500 px-4 py-2 rounded-lg transition z-[2000] flex items-center gap-2"
      title="Logout"
    >
      LOGOUT
    </button>
  );
};

const UserNameDisplay = () => {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
  }, [location.pathname]); // Update on route change in case login happens

  if (location.pathname === '/login' || location.pathname === '/' || !user?.name) return null;

  return (
    <div className="fixed top-28 right-8 z-[2000] border-2 border-black px-4 py-1 rounded-full font-bold bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm uppercase tracking-wider">
      {user.name}
    </div>
  );
};

// Inline Contact Feature Component
import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

const ContactFeature = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [complaint, setComplaint] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const location = useLocation();

  // Optional: Hide contact on login if desired, but user didn't ask. 
  // keeping it everywhere.

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
      {/* Circular Floating Button - Moved Up to make room for Logout */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-50 w-12 h-12 bg-blue-600/80 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-500 transition-all hover:scale-110"
        style={{ position: 'fixed', bottom: '90px', right: '30px', zIndex: 9999 }}
        title="Contact Us"
      >
        <MessageCircle size={20} />
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
