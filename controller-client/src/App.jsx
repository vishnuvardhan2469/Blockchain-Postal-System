// controller-client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';

function App() {
  return (
    <BrowserRouter>
      <div className="gen-z-header">GEN-Z POSTAL SERVICES [ADMIN]</div>
      <GlobalLogout />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/verify/:type" element={<Verify />} /> {/* type: send or receive */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

const GlobalLogout = () => {
  const { pathname } = window.location; // Use window.location for simplicity outside Route context or use a proper hook wrapper
  // Actually, to use useLocation, we need to be inside BrowserRouter.
  // We can just use a simple check or more robustly:
  return <LogoutBtn />;
};

const LogoutBtn = () => {
  const [path, setPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    // Simple polling or event listener for path change if not using router hooks
    // Better: Just use useLocation inside a component rendered by Router
    const interval = setInterval(() => setPath(window.location.pathname), 100);
    return () => clearInterval(interval);
  }, []);

  if (path === '/login') return null;

  return (
    <button
      onClick={() => window.location.href = '/login'}
      className="fixed bottom-8 right-8 text-sm font-bold uppercase tracking-wide text-red-600 bg-white border-2 border-black hover:bg-black hover:text-red-500 px-4 py-2 rounded-lg transition z-[2000]"
    >
      Logout
    </button>
  );
};

export default App;
