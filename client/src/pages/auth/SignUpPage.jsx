import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../assets/images/Rectangle 40026.png';
// import loginImg from '../../assets/images/login-img.png';
import signupImg from '../../assets/images/signup.png';

function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = () => {
    console.log('Sign up data:', formData);
    navigate('/otp');
  };

  const handleBack = () => {
    navigate('/'); // Go back to login page
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
            src={signupImg} 
            alt="Sign up illustration" 
            className="max-w-full h-auto"
          />
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
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
            {/* Sign Up Form */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-mh-dark mb-6">
                  SignUp
                </h1>
              </div>

              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-mh-dark mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    className="input-field"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-mh-dark mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    className="input-field"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-mh-dark mb-2">
                    Mobile number
                  </label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-mh-white border border-r-0 border-gray-300 rounded-l-xl">
                      <span className="text-sm text-mh-dark">+1</span>
                    </div>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      placeholder="Enter your mobile number"
                      className="input-field rounded-l-none border-l-0"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-mh-dark mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="johndavid@gmail.com"
                    className="input-field"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-mh-dark mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter Password"
                      className="input-field pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-mh-green hover:underline"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Terms and Privacy */}
                <div className="text-sm text-gray-600">
                  <span>By clicking Sign up button, you agree to Stukya Stacks </span>
                  <button className="text-mh-green hover:underline">Terms of use</button>
                  <span> and </span>
                  <button className="text-mh-green hover:underline">Privacy Policy</button>
                </div>

                {/* Sign In Link */}
                <div className="text-center">
                  <span className="text-sm text-gray-600">Already have an account? </span>
                  <button 
                    onClick={() => navigate('/')}
                    className="text-sm text-mh-green hover:underline font-medium"
                  >
                    Sign In
                  </button>
                </div>

                <button
                  onClick={handleContinue}
                  className="bg-mh-gradient w-full py-4 text-mh-white font-semibold rounded-xl text-base hover:opacity-90 transition-opacity duration-200"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;