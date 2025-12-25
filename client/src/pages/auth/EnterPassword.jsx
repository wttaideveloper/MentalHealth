import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../assets/images/Rectangle 40026.png';
// import loginImg from '../../assets/images/login-img.png';
import otpImg from '../../assets/images/otp-img.png';

function EnterPassword() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    console.log('Login with password:', password);
    navigate('/dashboard');
  };

  const handleUseOtp = () => {
    navigate('/otp');
  };

  const handleBack = () => {
    navigate('/'); // Go back to login page
  };

  const handleForgotPassword = () => {
    navigate('/otp'); // Navigate to OTP for password reset
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
            src={otpImg} 
            alt="Password illustration" 
            className="max-w-full h-auto"
          />
        </div>
      </div>

      {/* Right Side - Password Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-4 sm:p-8">
        {/* Back Button */}
        <button 
          onClick={handleBack}
          className="flex items-center text-gray-600 mb-8 hover:text-gray-800 transition-colors self-start"
        >
          <div className="w-8 h-8 rounded-full border border-mh-green flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-mh-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="text-sm font-medium text-mh-dark">Back</span>
        </button>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Password Form */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-mh-dark mb-4">
                  Enter Password
                </h1>
                <div className="flex items-center space-x-2 mb-6">
                  <span className="text-sm font-medium text-mh-dark">johndavid@gmail.com</span>
                  <button className="text-sm text-mh-green hover:underline">Change</button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-mh-dark mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      className="input-field pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-right mt-2">
                    <button 
                      onClick={handleForgotPassword}
                      className="text-sm text-mh-green hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  className="bg-mh-gradient w-full py-4 text-mh-white font-semibold rounded-xl text-base hover:opacity-90 transition-opacity duration-200"
                >
                  Login
                </button>
              </div>

              {/* Use OTP Link */}
              <div className="text-center">
                <button 
                  onClick={handleUseOtp}
                  className="text-sm text-mh-green hover:underline"
                >
                  Use OTP to login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnterPassword;