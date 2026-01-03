import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Calendar, ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import assessmentLinkImg from '../../assets/images/Assesment-link.png'
import assLink1 from '../../assets/images/ass-link-1.png'
import { startLinkAttempt } from '../../api/publicAssessmentLinkApi'

const AssessmentViaLinkPage2 = () => {
  const navigate = useNavigate()
  const { token } = useParams()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    consent: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Invalid assessment link')
      navigate('/')
    }
  }, [token, navigate])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleContinue = async () => {
    if (!formData.consent) {
      toast.error('Please accept the consent to continue')
      return
    }

    if (!token) {
      toast.error('Invalid assessment link')
      return
    }

    try {
      setLoading(true)
      
      const participantInfo = {
        name: formData.fullName,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender
      }

      const response = await startLinkAttempt(token, participantInfo)
      
      if (response.success && response.data?.attempt) {
        const attemptId = response.data.attempt._id
        // Store attemptId in localStorage for the test page
        localStorage.setItem(`linkAttempt_${token}`, attemptId)
        // Navigate to test page with token and attemptId
        navigate(`/assessment-link/${token}/test/${attemptId}`)
      } else {
        toast.error(response.message || 'Failed to start assessment')
      }
    } catch (err) {
      console.error('Error starting attempt:', err)
      const errorMessage = err.response?.data?.message || 'Failed to start assessment'
      const eligibilityDetails = err.response?.data?.eligibilityDetails || []
      
      // Enhanced error message for eligibility issues
      if (err.response?.status === 400 && errorMessage.toLowerCase().includes('eligible')) {
        let fullMessage = errorMessage
        if (eligibilityDetails.length > 0) {
          fullMessage += '\n\nDetails:\n' + eligibilityDetails.map((detail, idx) => `• ${detail}`).join('\n')
        }
        toast.error(fullMessage, {
          duration: 6000,
          style: {
            maxWidth: '500px',
            whiteSpace: 'pre-line'
          }
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Background Image */}
      <div 
        className="w-full lg:w-1/2 h-64 lg:h-auto flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${assessmentLinkImg})` }}
      >
        <img 
          src={assLink1} 
          alt="Assessment" 
          className="max-w-xs lg:max-w-md w-full h-auto object-contain"
        />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center px-6 lg:px-12 py-8 lg:py-0">
        <div className="max-w-lg w-full">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-8">
            Before You Begin
          </h1>
          
          {/* Full Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 bg-gray-200 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your Email"
              className="w-full px-4 py-3 bg-gray-200 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Date of Birth and Gender */}
          <div className="flex flex-col sm:flex-row sm:space-x-4 mb-6">
            <div className="flex-1 mb-4 sm:mb-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-4 py-3 pl-12 bg-gray-200 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-10 bg-gray-200 border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start space-x-3 mb-8">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleInputChange}
                className="custom-checkbox"
              />
            </div>
            <label className="text-sm text-gray-600 leading-relaxed">
              I agree to participate in this assessment and understand how my data will be used.
            </label>
          </div>

          {/* Continue Button */}
          <button 
            onClick={handleContinue}
            disabled={!formData.consent || loading}
            className="w-full bg-mh-gradient disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-full transition-colors duration-200 text-base"
          >
            {loading ? 'Starting...' : 'Continue to Assessment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssessmentViaLinkPage2