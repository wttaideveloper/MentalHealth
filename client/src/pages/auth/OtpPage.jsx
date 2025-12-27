import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import bgImage from '../../assets/images/Rectangle 40026.png';
import otpImg from '../../assets/images/otp-img.png';
import { verifyEmail, resendVerificationCode } from '../../api/authApi';

function OtpPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Changed to 6 digits to match typical email verification tokens
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get email from URL params or navigation state
    const emailFromUrl = searchParams.get('email');
    const emailFromState = location.state?.email;
    const isSignUpFromState = location.state?.isSignUp;
    
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    } else if (emailFromState) {
      setEmail(emailFromState);
    }
    
    if (isSignUpFromState) {
      setIsSignUp(true);
    }
  }, [location, searchParams]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) {
      return;
    }
    
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError('');

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyEmail(email, otpValue);
      
      if (response.success) {
        navigate('/login', { 
          state: { 
            message: 'Email verified successfully! Please login.' 
          } 
        });
      } else {
        setError(response.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Verification failed. Please check the code and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page (signup or password)
  };

  const handleUsePassword = () => {
    navigate('/password');
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await resendVerificationCode(email);
      
      if (response.success) {
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        setError('');
        // Show success message (you can add a toast notification here)
        alert('Verification code has been sent to your email.');
      } else {
        setError(response.message || 'Failed to resend code. Please try again.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to resend code. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
            alt="OTP illustration" 
            className="max-w-full h-auto"
          />
        </div>
      </div>

      {/* Right Side - OTP Form */}
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
            {/* OTP Form */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-mh-dark mb-4">
                  Enter OTP
                </h1>
                <p className="text-sm text-gray-600 mb-2">
                  We have sent a verification code to your registered email
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-mh-dark">{email || 'johndavid@gmail.com'}</span>
                  <button 
                    onClick={() => navigate('/login')}
                    className="text-sm text-mh-green hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-mh-dark">
                      Verification Code
                    </label>
                    <div className="flex items-center space-x-2">
                      <button 
                        type="button"
                        onClick={handleResend}
                        className="text-sm text-mh-green hover:underline"
                      >
                        Resend
                      </button>
                    </div>
                  </div>
                  
                  {/* OTP Input Fields */}
                  <div className="flex space-x-3 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:border-mh-green focus:outline-none bg-mh-white"
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="bg-mh-gradient w-full py-4 text-mh-white font-semibold rounded-xl text-base hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>

              {/* Use Password Link */}
              <div className="text-center">
                <button 
                  onClick={handleUsePassword}
                  className="text-sm text-mh-green hover:underline"
                >
                  Use password to login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OtpPage;