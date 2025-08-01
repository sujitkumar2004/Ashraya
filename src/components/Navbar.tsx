import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Menu, X, User, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-teal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-teal-600" />
              <span className="text-2xl font-bold text-gray-900">Ashraya</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-teal-600 transition-colors duration-200"
                >
                  Dashboard
                </Link>
                <Link
                  to="/therapy"
                  className="text-gray-700 hover:text-teal-600 transition-colors duration-200"
                >
                  Therapy
                </Link>
                <Link
                  to="/peer-groups"
                  className="text-gray-700 hover:text-teal-600 transition-colors duration-200"
                >
                  Peer Groups
                </Link>
                <Link
                  to="/stories"
                  className="text-gray-700 hover:text-teal-600 transition-colors duration-200"
                >
                  Stories
                </Link>
                <Link
                  to="/resources"
                  className="text-gray-700 hover:text-teal-600 transition-colors duration-200"
                >
                  Resources
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-teal-600 transition-colors duration-200"
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-teal-600 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors duration-200"
                >
                  Join Community
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-teal-600"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-gray-700 hover:text-teal-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/therapy"
                    className="block px-3 py-2 text-gray-700 hover:text-teal-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Therapy
                  </Link>
                  <Link
                    to="/peer-groups"
                    className="block px-3 py-2 text-gray-700 hover:text-teal-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Peer Groups
                  </Link>
                  <Link
                    to="/stories"
                    className="block px-3 py-2 text-gray-700 hover:text-teal-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Stories
                  </Link>
                  <Link
                    to="/resources"
                    className="block px-3 py-2 text-gray-700 hover:text-teal-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Resources
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 text-gray-700 hover:text-teal-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <div className="px-3 py-2 text-sm text-gray-600">
                    Logged in as {user.name}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-gray-700 hover:text-teal-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-teal-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Join Community
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