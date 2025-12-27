import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../assets/images/Rectangle 40026.png';
import loginImg from '../../assets/images/login-img.png';
import { showToast } from '../../utils/toast';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = (e) => {
    e?.preventDefault();
    
    if (!email || !email.trim()) {
      showToast.error('Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast.error('Please enter a valid email address');
      return;
    }

    showToast.success('Email verified! Proceeding to password.');
    // Navigate to password page with email in state
    navigate('/password', { state: { email: email.trim() } });
  };

  const handleGoogleSignIn = () => {
    console.log('Sign in with Google');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-mh-light flex">
      {/* Left Side - Illustration */}
      <div 
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 relative"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="relative z-10">
          <img 
            src={loginImg} 
            alt="Login illustration" 
            className="max-w-full h-auto"
          />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Back Button - Hidden on login page as it's the entry point */}
          <div className="mb-8 h-8"></div>

          {/* Login Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-mh-dark mb-2">
                Login or SignUp
              </h1>
            </div>

            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mh-dark mb-2">
                  Mobile number / Email
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Mobile number / Email"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-mh-gradient w-full py-4 text-mh-white font-semibold rounded-xl text-base hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : 'Continue'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-mh-light text-mh-dark">Or continue with</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <button 
                onClick={handleSignUp}
                className="text-sm text-mh-green hover:underline font-medium"
              >
                Sign Up
              </button>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-mh-white border border-gray-200 rounded-xl py-4 px-4 flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-medium">Sign in with Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;