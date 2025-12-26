import { Link } from 'react-router-dom';
import { useState } from 'react';
import logo from '../assets/images/logo.png';
import profileImage from '../assets/images/profile.png';

const mockUser = {
  firstName: 'John',
  lastName: 'David',
  avatar: profileImage
};

function UserHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              <div className="flex items-center bg-[#E8F1EE] rounded-full px-4 py-2 space-x-3">
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-normal">
                    Welcome
                  </div>
                  <div className="text-sm text-mh-dark font-semibold">
                    {mockUser.firstName} {mockUser.lastName}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {mockUser.avatar ? (
                    <img src={mockUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-mh-gradient flex items-center justify-center text-white text-sm font-semibold">
                      {mockUser.firstName.charAt(0)}{mockUser.lastName.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
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
              <button className="w-full text-left px-3 py-2 bg-mh-green text-mh-white rounded-lg font-medium mt-2">
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