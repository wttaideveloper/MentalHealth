import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import profileImage from '../assets/images/profile.png';
import { getMe } from '../api/authApi';
import { clearTokens, getRefreshToken } from '../utils/auth';
import { showToast } from '../utils/toast';

function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
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
      navigate('/admin-login');
    } catch (error) {
      console.error('Logout error:', error);
      clearTokens();
      setIsDropdownOpen(false);
      showToast.success('Logged out successfully!');
      navigate('/admin-login');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="h-screen bg-mh-light overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-mh-white shadow-sm border-b border-gray-100 flex-shrink-0 z-40">
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6">
          {/* Left: Logo and Sidebar Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-mh-dark hover:text-mh-green hover:bg-gray-100 rounded-lg focus:outline-none transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/admin/dashboard" className="flex items-center space-x-2 min-w-0">
              <img src={logo} alt="Soukya Stacks" className="h-6 sm:h-8 w-auto flex-shrink-0" />
              <span className="text-base sm:text-lg font-semibold text-mh-dark hidden xs:block truncate">Admin Panel</span>
            </Link>
          </div>

          {/* Right: User Profile */}
          <div className="flex items-center flex-shrink-0">
            {loading ? (
              <div className="flex items-center bg-[#E8F1EE] rounded-full px-2 sm:px-4 py-1.5 sm:py-2">
                <div className="text-xs sm:text-sm text-mh-dark">Loading...</div>
              </div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center bg-[#E8F1EE] rounded-full px-2 sm:px-4 py-1.5 sm:py-2 space-x-2 sm:space-x-3 hover:bg-[#D4E5DF] transition-colors cursor-pointer"
                  aria-label="User menu"
                >
                  <div className="text-right hidden md:block">
                    <div className="text-xs text-gray-500 font-normal">Admin</div>
                    <div className="text-sm text-mh-dark font-semibold truncate max-w-24 lg:max-w-32">
                      {user.firstName || ''} {user.lastName || ''}
                    </div>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-mh-gradient flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                        {user.firstName?.charAt(0) || 'A'}{user.lastName?.charAt(0) || ''}
                      </div>
                    )}
                  </div>
                  <svg 
                    className={`w-3 h-3 sm:w-4 sm:h-4 text-mh-dark transition-transform hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-mh-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <div className="text-xs text-gray-500">Signed in as</div>
                      <div className="text-sm text-mh-dark font-semibold break-words">
                        {user.email}
                      </div>
                    </div>
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
              <div className="flex items-center bg-[#E8F1EE] rounded-full px-2 sm:px-4 py-1.5 sm:py-2">
                <div className="text-xs sm:text-sm text-mh-dark">Admin</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container - Flex layout for sidebar and content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        
        {/* Sidebar */}
        <aside
          className={`bg-mh-white border-r border-gray-200 transition-all duration-300 flex flex-col flex-shrink-0 ${
            isSidebarOpen 
              ? 'w-64 fixed left-0 top-14 sm:top-16 bottom-0 z-30 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] lg:relative lg:top-0 lg:h-full' 
              : 'w-0 lg:w-16 fixed left-0 top-14 sm:top-16 bottom-0 z-30 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] lg:relative lg:top-0 lg:h-full overflow-hidden'
          }`}
        >
          <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2 flex-1 overflow-y-auto min-h-0">
            <Link
              to="/admin/dashboard"
              className={`flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors group ${
                isActive('/admin/dashboard')
                  ? 'bg-[#E8F1EE] text-mh-green font-semibold'
                  : 'text-mh-dark hover:bg-gray-50'
              } ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
              title={!isSidebarOpen ? 'Dashboard' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className={`text-sm sm:text-base ${!isSidebarOpen ? 'lg:hidden' : ''}`}>Dashboard</span>
            </Link>
            
            <Link
              to="/admin/reports"
              className={`flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors group ${
                isActive('/admin/reports')
                  ? 'bg-[#E8F1EE] text-mh-green font-semibold'
                  : 'text-mh-dark hover:bg-gray-50'
              } ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
              title={!isSidebarOpen ? 'Reports' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className={`text-sm sm:text-base ${!isSidebarOpen ? 'lg:hidden' : ''}`}>Reports</span>
            </Link>
            <Link
              to="/admin/users"
              className={`flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors group ${
                isActive('/admin/users')
                  ? 'bg-[#E8F1EE] text-mh-green font-semibold'
                  : 'text-mh-dark hover:bg-gray-50'
              } ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
              title={!isSidebarOpen ? 'Users' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className={`text-sm sm:text-base ${!isSidebarOpen ? 'lg:hidden' : ''}`}>Users</span>
            </Link>
            <Link
              to="/admin/assessments"
              className={`flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors group ${
                isActive('/admin/assessments')
                  ? 'bg-[#E8F1EE] text-mh-green font-semibold'
                  : 'text-mh-dark hover:bg-gray-50'
              } ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
              title={!isSidebarOpen ? 'Assessments' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className={`text-sm sm:text-base ${!isSidebarOpen ? 'lg:hidden' : ''}`}>Assessments</span>
            </Link>
            <Link
              to="/admin/results"
              className={`flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors group ${
                isActive('/admin/results')
                  ? 'bg-[#E8F1EE] text-mh-green font-semibold'
                  : 'text-mh-dark hover:bg-gray-50'
              } ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
              title={!isSidebarOpen ? 'Assessment Results' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className={`text-sm sm:text-base ${!isSidebarOpen ? 'lg:hidden' : ''}`}>Assessment Results</span>
            </Link>
            <Link
              to="/admin/assessment-links"
              className={`flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors group ${
                isActive('/admin/assessment-links')
                  ? 'bg-[#E8F1EE] text-mh-green font-semibold'
                  : 'text-mh-dark hover:bg-gray-50'
              } ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
              title={!isSidebarOpen ? 'Assessment Links' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className={`text-sm sm:text-base ${!isSidebarOpen ? 'lg:hidden' : ''}`}>Assessment Links</span>
            </Link>
            <Link
              to="/admin/group-assessments"
              className={`flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors group ${
                isActive('/admin/group-assessments')
                  ? 'bg-[#E8F1EE] text-mh-green font-semibold'
                  : 'text-mh-dark hover:bg-gray-50'
              } ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
              title={!isSidebarOpen ? 'Group Assessments' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className={`text-sm sm:text-base ${!isSidebarOpen ? 'lg:hidden' : ''}`}>Group Assessments</span>
            </Link>
          </nav>

          {/* Logout Button at Bottom */}
          <div className="p-3 sm:p-4 border-t border-gray-200 bg-mh-white flex-shrink-0">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50 hover:text-red-700 font-medium ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
              title={!isSidebarOpen ? 'Logout' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className={`text-sm sm:text-base ${!isSidebarOpen ? 'lg:hidden' : ''}`}>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content - Scrollable */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-mh-light">
          <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;

