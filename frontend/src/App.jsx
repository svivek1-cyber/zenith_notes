import React from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Notes from './pages/Notes'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './AuthContext'
import Profile from './components/Profile'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/*" element={<PageNotFound />} />
      </Routes>
    </AuthProvider>
  )
}

const PageNotFound = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-surface-container">
      <div className="flex flex-col justify-center items-center border-white border-2 p-8 rounded-2xl bg-surface-container-high">
        <h1 className="text-4xl font-bold mb-2 text-gray-800">Error: 404</h1>
        <div className="text-gray-600 text-lg">This page is not available</div>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleBack}
            className="text-white bg-black hover:bg-gray-800 px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};