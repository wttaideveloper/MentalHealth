import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Timer, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import assessmentLinkImg from '../../assets/images/Assesment-link.png'
import assLink1 from '../../assets/images/ass-link-1.png'
import { validateAssessmentLink } from '../../api/publicAssessmentLinkApi'

const AssessmentViaLinkPage1 = () => {
  const navigate = useNavigate()
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [linkData, setLinkData] = useState(null)
  const [testData, setTestData] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(null)

  useEffect(() => {
    if (token) {
      validateLink()
    } else {
      toast.error('Invalid assessment link')
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (linkData?.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const expiry = new Date(linkData.expiresAt).getTime()
        const remaining = Math.max(0, expiry - now)
        
        if (remaining > 0) {
          const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
          const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          setTimeRemaining({ days, hours })
        } else {
          setTimeRemaining(null)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [linkData?.expiresAt])

  const validateLink = async () => {
    try {
      setLoading(true)
      // First try regular assessment link
      const response = await validateAssessmentLink(token)
      
      if (response.success && response.data) {
        setLinkData(response.data.link)
        setTestData(response.data.test)
      } else {
        toast.error(response.message || 'Invalid assessment link')
      }
    } catch (err) {
      // If regular link fails, check if it's a group assessment link
      try {
        const { validateGroupAssessmentLink } = await import('../../api/groupAssessmentLinkApi')
        const groupResponse = await validateGroupAssessmentLink(token)
        
        if (groupResponse.success && groupResponse.data) {
          // Redirect to group assessment role selection page
          window.location.href = `/group-assessment-link/${token}/select-role`
          return
        }
      } catch (groupErr) {
        console.error('Error validating group link:', groupErr)
      }
      
      console.error('Error validating link:', err)
      toast.error(err.response?.data?.message || 'Failed to validate assessment link')
    } finally {
      setLoading(false)
    }
  }

  const handleStartNow = () => {
    if (token) {
      navigate(`/assessment-link/${token}/step2`)
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

      {/* Right Side - Content */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center px-6 lg:px-12 py-8 lg:py-0">
        <div className="max-w-md w-full">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mh-green"></div>
              <p className="mt-4 text-gray-600">Loading assessment...</p>
            </div>
          ) : linkData && testData ? (
            <>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4">
                {testData.title || "Let's Begin Your Wellness Assessment"}
              </h1>
              
              <p className="text-sm lg:text-md text-gray-600 mb-6 leading-relaxed">
                {linkData.campaignName 
                  ? `This assessment is part of an ongoing campaign organized by ${linkData.campaignName}. Please complete the test within the allotted time.`
                  : "Please complete the test within the allotted time."
                }
              </p>
              
              <div className="bg-[#DDEFE7] border border-blue-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {testData.shortDescription || testData.longDescription || "Answer a set of short, research-based questions to help evaluate your mental well-being. Your responses are private and securely stored."}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-around space-y-4 sm:space-y-0 mb-8">
                {timeRemaining && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Timer className="w-4 h-4 text-blue-400" />
                      <p className="text-sm text-gray-500">Campaign Ends In</p>
                    </div>
                    <p className="text-xs text-mh-green font-bold ml-6">
                      {timeRemaining.days > 0 ? `${timeRemaining.days} Day${timeRemaining.days > 1 ? 's' : ''} ` : ''}
                      {timeRemaining.hours} Hour{timeRemaining.hours !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-rose-400" />
                    <p className="text-sm text-gray-500">Participants</p>
                  </div>
                  <p className="text-xs font-bold text-mh-green ml-6">
                    {linkData.currentAttempts || 0} joined so far
                    {linkData.maxAttempts ? ` / ${linkData.maxAttempts}` : ''}
                  </p>
                </div>

                {linkData.linkType === 'paid' && linkData.price > 0 && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-gray-500">Price</p>
                    </div>
                    <p className="text-xs font-bold text-blue-600 ml-6">
                      ₹{linkData.price}
                    </p>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleStartNow}
                className="w-full bg-mh-gradient hover:bg-green-800 text-white font-medium py-3 px-6 rounded-full transition-colors duration-200"
              >
                Start Now
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Invalid or expired assessment link</p>
              <p className="text-sm text-gray-600">Please contact the organizer for a valid link.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssessmentViaLinkPage1