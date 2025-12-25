import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../assets/images/Rectangle 40026.png';
import otpImg from '../../assets/images/otp-img.png';

function OtpPage() {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const handleOtpChange = (index, value) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join('');
    console.log('OTP:', otpValue);
    navigate('/dashboard'); // Navigate to dashboard after successful OTP verification
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page (signup or password)
  };

  const handleUsePassword = () => {
    navigate('/password');
  };

  const handleResend = () => {
    console.log('Resend OTP');
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
                  <span className="text-sm font-medium text-mh-dark">johndavid@gmail.com</span>
                  <button className="text-sm text-mh-green hover:underline">Change</button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-mh-dark">
                      OTP
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-mh-green">56 Sec</span>
                      <button 
                        onClick={handleResend}
                        className="text-sm text-mh-dark hover:underline"
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
                  className="bg-mh-gradient w-full py-4 text-mh-white font-semibold rounded-xl text-base hover:opacity-90 transition-opacity duration-200"
                >
                  Verify
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