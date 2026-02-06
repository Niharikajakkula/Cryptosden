import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        alert('OAuth authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      if (token) {
        try {
          // Store token
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user data
          const response = await axios.get('/api/auth/me');
          setUser(response.data);
          
          // Redirect to dashboard
          navigate('/dashboard');
        } catch (error) {
          console.error('Error processing OAuth success:', error);
          alert('Authentication failed. Please try again.');
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    handleOAuthSuccess();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing authentication...</p>
        <p className="text-slate-400 text-sm mt-2">Please wait while we sign you in</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;