import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import logo from '../assets/images/logo.png';
import profileImage from '../assets/images/profile.png';
import { getMe } from '../api/authApi';
import { clearTokens, getRefreshToken } from '../utils/auth';
import { showToast } from '../utils/toast';

function UserHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Fetch user data when component mounts
    const fetchUser = async () => {
      try {
        const response = await getMe();
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        // Call logout API
        try {
          const { logout } = await import('../api/authApi');
          await logout(refreshToken);
        } catch (error) {
          console.error('Logout API error:', error);
        }
      }
      clearTokens();
      setIsDropdownOpen(false);
      showToast.success('Logged out successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens and redirect anyway
      clearTokens();
      setIsDropdownOpen(false);
      showToast.success('Logged out successfully!');
      navigate('/login');
    }
  };

  return (
    <header className="bg-mh-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/user-home" className="flex items-center space-x-2">
              <img src={logo} alt="Soukya Stacks" className="h-8 w-auto" />
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            <nav className="hidden md:flex items-center space-x-8" style={{fontFamily: 'Manrope', fontWeight: 500, fontSize: '14px', lineHeight: '160%', letterSpacing: '0%'}}>
              <Link to="/user-home" className="text-mh-dark hover:text-mh-green font-medium transition-colors">
                Home
              </Link>
              <Link to="/user/assessments" className="text-mh-dark hover:text-mh-green font-medium transition-colors">
                All Assessments
              </Link>
              <Link to="/my-assessments" className="text-mh-dark hover:text-mh-green font-medium transition-colors">
                My Assessments
              </Link>
              <Link to="/user/contact" className="text-mh-dark hover:text-mh-green font-medium transition-colors">
                Contact Us
              </Link>
            </nav>

            <div className="hidden md:flex items-center" style={{fontFamily: 'Manrope', fontWeight: 500, fontSize: '14px', lineHeight: '160%', letterSpacing: '0%'}}>
              {loading ? (
                <div className="flex items-center bg-[#E8F1EE] rounded-full px-4 py-2">
                  <div className="text-sm text-mh-dark">Loading...</div>
                </div>
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center bg-[#E8F1EE] rounded-full px-4 py-2 space-x-3 hover:bg-[#D4E5DF] transition-colors cursor-pointer"
                  >
                    <div className="text-right">
                      <div className="text-xs text-gray-500 font-normal">
                        Welcome
                      </div>
                      <div className="text-sm text-mh-dark font-semibold">
                        {user.firstName || ''} {user.lastName || ''}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-mh-gradient flex items-center justify-center text-white text-sm font-semibold">
                          {user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}
                        </div>
                      )}
                    </div>
                    <svg 
                      className={`w-4 h-4 text-mh-dark transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-mh-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-mh-dark hover:bg-[#E8F1EE] transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center bg-[#E8F1EE] rounded-full px-4 py-2">
                  <div className="text-sm text-mh-dark">User</div>
                </div>
              )}
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-mh-dark hover:text-mh-green focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/user-home" className="block px-3 py-2 text-mh-dark hover:text-mh-green font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/user/assessments" className="block px-3 py-2 text-mh-dark hover:text-mh-green font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                All Assessments
              </Link>
              <Link to="/my-assessments" className="block px-3 py-2 text-mh-dark hover:text-mh-green font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                My Assessments
              </Link>
              <Link to="/user/contact" className="block px-3 py-2 text-mh-dark hover:text-mh-green font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Contact Us
              </Link>
              {user && (
                <div className="px-3 py-2 border-t border-gray-200 mt-2">
                  <div className="text-xs text-gray-500 mb-1">Welcome</div>
                  <div className="text-sm text-mh-dark font-semibold mb-2">
                    {user.firstName || ''} {user.lastName || ''}
                  </div>
                </div>
              )}
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 bg-mh-gradient text-mh-white rounded-lg font-medium mt-2"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default UserHeader;