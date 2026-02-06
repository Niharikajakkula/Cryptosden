import { useNavigate } from 'react-router-dom';
import { TrendingUp, Brain, Shield, Activity, Star, ArrowRight } from 'lucide-react';

// Social login icons
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

function Welcome() {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3463';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handleFacebookLogin = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3463';
    window.location.href = `${apiUrl}/api/auth/facebook`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-purple-600/10 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-4xl">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-4">Welcome to Cryptosden</h1>
            <p className="text-slate-300 text-xl mb-2">Your comprehensive cryptocurrency platform</p>
            <p className="text-slate-400 text-lg">AI insights • Trust Scores • EVI analysis • Real-time trading</p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
              <Brain className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">AI Assistant</h3>
              <p className="text-slate-400 text-sm">Intelligent crypto insights and trading guidance</p>
            </div>
            
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
              <Shield className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Trust Score</h3>
              <p className="text-slate-400 text-sm">Proprietary algorithm to assess crypto reliability</p>
            </div>
            
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
              <Activity className="h-8 w-8 text-orange-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">EVI Index</h3>
              <p className="text-slate-400 text-sm">Emotional Volatility Index for market sentiment</p>
            </div>
            
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center">
              <Star className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Portfolio</h3>
              <p className="text-slate-400 text-sm">Track and manage your crypto investments</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Get Started Today</h2>
            <p className="text-slate-300 text-lg mb-8">Join thousands of traders using advanced crypto analytics</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Create Account
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-slate-700/50 border border-slate-600/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-700/70 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200"
              >
                Sign In
              </button>
            </div>
            
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800/50 text-slate-400">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6 max-w-sm mx-auto">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full bg-white border border-slate-300 text-slate-700 py-3 px-4 rounded-xl font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <GoogleIcon />
                  Google
                </button>
                
                <button
                  onClick={handleFacebookLogin}
                  className="w-full bg-[#1877F2] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FacebookIcon />
                  Facebook
                </button>
              </div>
            </div>
            
            <div className="mt-6 text-slate-400 text-sm">
              <p>Already have an account? <button onClick={() => navigate('/login')} className="text-blue-400 hover:text-blue-300 font-medium">Sign in here</button></p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-slate-400 text-sm">
              Secure • Reliable • Professional • Real-time Data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;