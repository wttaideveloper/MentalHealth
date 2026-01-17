import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import bgImage from '../../assets/images/Rectangle 40026.png';
import signupImg from '../../assets/images/signup.png';
import { signup } from '../../api/authApi';
import { showToast } from '../../utils/toast';
import DatePicker from '../../components/DatePicker';

function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    password: '',
    dob: '',
    gender: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      showToast.error('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      showToast.error('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      showToast.error('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      showToast.error('Password must be at least 6 characters long');
      return false;
    }
    if (!formData.dob) {
      showToast.error('Date of birth is required');
      return false;
    }
    // Validate age (must be at least 13 years old)
    const today = new Date();
    const birthDate = new Date(formData.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 13) {
      showToast.error('You must be at least 13 years old to register');
      return false;
    }
    if (age > 120) {
      showToast.error('Please enter a valid date of birth');
      return false;
    }
    return true;
  };

  const handleContinue = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await signup(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.dob,
        formData.gender
      );

      if (response.success) {
        showToast.success('Account created successfully!');
        // Navigate to OTP page with email for verification
        navigate('/otp', { 
          state: { 
            email: formData.email,
            isSignUp: true 
          } 
        });
      } else {
        showToast.error(response.message || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Sign up failed. Please try again.';
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/login'); // Go back to login page
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

              <form onSubmit={handleContinue} className="space-y-4">
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
                    required
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
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-mh-dark mb-2">
                    Mobile number
                  </label>
                  <div className="relative">
                    <PhoneInput
                      international
                      defaultCountry="US"
                      value={formData.mobile}
                      onChange={(value) => handleInputChange('mobile', value || '')}
                      placeholder="Enter your mobile number"
                      className="phone-input-wrapper w-full"
                      inputClassName="w-full"
                      numberInputProps={{
                        className: "w-full"
                      }}
                      countrySelectProps={{
                        className: "country-select"
                      }}
                      countries={undefined}
                      withCountryCallingCode={true}
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
                    required
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-mh-dark mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    placeholder="Select your date of birth"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Required for age-restricted assessments</p>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-mh-dark mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
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
                      placeholder="Enter Password (min 6 characters)"
                      className="input-field pr-16"
                      minLength={6}
                      required
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
                    onClick={() => navigate('/login')}
                    className="text-sm text-mh-green hover:underline font-medium"
                  >
                    Sign In
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-mh-gradient w-full py-4 text-mh-white font-semibold rounded-xl text-base hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Continue'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;