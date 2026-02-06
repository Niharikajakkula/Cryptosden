import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CryptoProvider } from './contexts/CryptoContext';
import Navbar from './components/Navbar';
import AIChatbot from './components/AIChatbot';
import AlertNotifications from './components/AlertNotifications';
import ProtectedRoute from './components/ProtectedRoute';
import Welcome from './pages/Welcome';
import EmotionalVolatility from './pages/EmotionalVolatility';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import CryptoDetail from './pages/CryptoDetail';
import Watchlist from './pages/Watchlist';
import PricePredictions from './pages/PricePredictions';
import SmartAlerts from './pages/SmartAlerts';
import NotificationCenter from './pages/NotificationCenter';
import Community from './pages/Community';
import CreatePost from './pages/CreatePost';
import CreatePoll from './pages/CreatePoll';
import PostDetail from './pages/PostDetail';
import Trading from './pages/Trading';
import Portfolio from './pages/Portfolio';
import AdminDashboard from './pages/AdminDashboard';
import RestoreAccount from './pages/RestoreAccount';
import OAuthSuccess from './components/OAuthSuccess';
import './App.css';

function AppContent() {
  const location = useLocation();
  const path = location.pathname.replace(/\/$/, '') || '/'; // normalize trailing slash
  
  // Hide navbar on authentication pages and welcome page
  const authPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/restore-account', '/auth/success'];
  const hideNavbar = authPaths.includes(path);
  
  // Don't show the separate navbar component since Dashboard has its own navigation
  const showNavbar = false;

  return (
    <div className="App no-drag">
      {showNavbar && <Navbar />}
      <main className={hideNavbar ? "auth-content" : "main-content"}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/restore-account" element={<RestoreAccount />} />
          <Route path="/auth/success" element={<OAuthSuccess />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/emotional-volatility" element={
            <ProtectedRoute>
              <EmotionalVolatility />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/crypto/:id" element={
            <ProtectedRoute>
              <CryptoDetail />
            </ProtectedRoute>
          } />
          <Route path="/watchlist" element={
            <ProtectedRoute>
              <Watchlist />
            </ProtectedRoute>
          } />
          <Route path="/community" element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          } />
          <Route path="/community/create-post" element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          } />
          <Route path="/community/create-poll" element={
            <ProtectedRoute>
              <CreatePoll />
            </ProtectedRoute>
          } />
          <Route path="/community/posts/:postId" element={
            <ProtectedRoute>
              <PostDetail />
            </ProtectedRoute>
          } />
          <Route path="/predictions" element={
            <ProtectedRoute>
              <PricePredictions />
            </ProtectedRoute>
          } />
          <Route path="/smart-alerts" element={
            <ProtectedRoute>
              <SmartAlerts />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationCenter />
            </ProtectedRoute>
          } />
          <Route path="/trading" element={
            <ProtectedRoute>
              <Trading />
            </ProtectedRoute>
          } />
          <Route path="/portfolio" element={
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      {/* AI Chatbot - Available on all pages except auth pages */}
      {!hideNavbar && <AIChatbot />}
      {/* Alert Notifications - Available on all pages except auth pages */}
      {!hideNavbar && <AlertNotifications />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CryptoProvider>
        <Router>
          <AppContent />
        </Router>
      </CryptoProvider>
    </AuthProvider>
  );
}

export default App;