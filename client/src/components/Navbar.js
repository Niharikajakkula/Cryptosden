import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Menu, 
  X, 
  TrendingUp, 
  User, 
  LogOut, 
  Heart, 
  BarChart3, 
  MessageSquare, 
  Shield, 
  Activity, 
  Bell,
  Wallet,
  PieChart,
  Brain,
  Mail
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Debug logging
  console.log('Navbar - User state:', user);
  console.log('Navbar - User exists:', !!user);

  // Show user navigation when user is authenticated
  const showUserNav = !!user;

  const handleLogout = () => {
    console.log('Logout clicked');
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-white" />
              <span className="text-white text-xl font-bold">Cryptosden</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {showUserNav ? (
              <>
                {/* Core Features */}
                <Link to="/dashboard" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium">
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                
                <Link to="/emotional-volatility" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium">
                  <Brain className="h-4 w-4" />
                  <span>Emotion Insights</span>
                </Link>

                {/* Trading & Portfolio */}
                {(user?.role === 'trader' || user?.role === 'admin') && (
                  <>
                    <Link to="/trading" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      <span>Trading</span>
                    </Link>
                    
                    <Link to="/portfolio" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium">
                      <PieChart className="h-4 w-4" />
                      <span>Portfolio</span>
                    </Link>
                  </>
                )}

                <Link to="/watchlist" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium">
                  <Heart className="h-4 w-4" />
                  <span>Watchlist</span>
                </Link>

                {/* AI & Alerts */}
                <Link to="/predictions" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium">
                  <Brain className="h-4 w-4" />
                  <span>AI Predictions</span>
                </Link>
                
                <Link to="/smart-alerts" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium">
                  <Bell className="h-4 w-4" />
                  <span>Smart Alerts</span>
                </Link>

                {/* Community */}
                <Link to="/community" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  <span>Community</span>
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium">
                  <Mail className="h-4 w-4" />
                  <span>Notifications</span>
                </Link>
                
                {/* User Menu */}
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-white/20">
                  <Link to="/profile" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium">
                    <User className="h-4 w-4" />
                    <span>{user?.name || 'Profile'}</span>
                  </Link>
                  
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="text-white hover:text-blue-200 transition-colors flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium">
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md hover:bg-white/10 text-sm font-medium"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Guest Navigation */}
                <Link to="/" className="text-white hover:text-blue-200 transition-colors px-3 py-2 rounded-md hover:bg-white/10 font-medium">
                  Home
                </Link>
                <div className="flex items-center space-x-3 ml-4">
                  <Link
                    to="/login"
                    className="text-white hover:text-blue-200 transition-colors font-medium px-4 py-2 rounded-md hover:bg-white/10"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    Sign Up
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-blue-200 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-blue-700/50 rounded-lg mt-2">
              {showUserNav ? (
                <>
                  {/* Core Features */}
                  <div className="text-blue-200 text-xs font-semibold uppercase tracking-wide px-3 py-2">
                    Core Features
                  </div>
                  <Link
                    to="/dashboard"
                    className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/emotional-volatility"
                    className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Brain className="h-4 w-4" />
                    <span>Emotion Insights</span>
                  </Link>
                  <Link
                    to="/watchlist"
                    className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="h-4 w-4" />
                    <span>Watchlist</span>
                  </Link>

                  {/* Trading & Portfolio */}
                  {(user?.role === 'trader' || user?.role === 'admin') && (
                    <>
                      <div className="text-blue-200 text-xs font-semibold uppercase tracking-wide px-3 py-2 mt-4">
                        Trading
                      </div>
                      <Link
                        to="/trading"
                        className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <TrendingUp className="h-4 w-4" />
                        <span>Trading</span>
                      </Link>
                      <Link
                        to="/portfolio"
                        className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <PieChart className="h-4 w-4" />
                        <span>Portfolio</span>
                      </Link>
                    </>
                  )}

                  {/* AI & Alerts */}
                  <div className="text-blue-200 text-xs font-semibold uppercase tracking-wide px-3 py-2 mt-4">
                    AI & Alerts
                  </div>
                  <Link
                    to="/predictions"
                    className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Brain className="h-4 w-4" />
                    <span>AI Predictions</span>
                  </Link>
                  <Link
                    to="/smart-alerts"
                    className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Bell className="h-4 w-4" />
                    <span>Smart Alerts</span>
                  </Link>

                  {/* Community & Communication */}
                  <div className="text-blue-200 text-xs font-semibold uppercase tracking-wide px-3 py-2 mt-4">
                    Community
                  </div>
                  <Link
                    to="/community"
                    className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Community</span>
                  </Link>
                  <Link
                    to="/notifications"
                    className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Notifications</span>
                  </Link>

                  {/* Account */}
                  <div className="text-blue-200 text-xs font-semibold uppercase tracking-wide px-3 py-2 mt-4">
                    Account
                  </div>
                  <Link
                    to="/profile"
                    className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile ({user?.name || 'User'})</span>
                  </Link>
                  
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="text-white flex items-center space-x-2 px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="text-white block px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/login"
                    className="text-white block px-3 py-2 hover:text-blue-200 hover:bg-white/10 rounded-md font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 block px-3 py-2 mx-3 rounded-md hover:bg-blue-50 font-medium text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;