import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Users, UserCheck } from 'lucide-react'
import { toast } from 'react-hot-toast'
import assessmentLinkImg from '../../assets/images/Assesment-link.png'
import assLink1 from '../../assets/images/ass-link-1.png'
import { validateGroupAssessmentLink } from '../../api/groupAssessmentLinkApi'

const GroupAssessmentRoleSelectionPage = () => {
  const navigate = useNavigate()
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [linkData, setLinkData] = useState(null)
  const [testData, setTestData] = useState(null)
  const [selectedPerspective, setSelectedPerspective] = useState(null)

  useEffect(() => {
    if (token) {
      validateLink()
    } else {
      toast.error('Invalid assessment link')
      setLoading(false)
    }
  }, [token])

  const validateLink = async () => {
    try {
      setLoading(true)
      const response = await validateGroupAssessmentLink(token)
      
      if (response.success && response.data) {
        setLinkData(response.data.link)
        setTestData(response.data.test)
      } else {
        toast.error(response.message || 'Invalid group assessment link')
      }
    } catch (err) {
      console.error('Error validating link:', err)
      toast.error(err.response?.data?.message || 'Failed to validate group assessment link')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRole = (perspectiveName) => {
    setSelectedPerspective(perspectiveName)
  }

  const handleContinue = () => {
    if (!selectedPerspective) {
      toast.error('Please select your role')
      return
    }
    
    // Store selected perspective in localStorage
    localStorage.setItem(`groupPerspective_${token}`, selectedPerspective)
    
    // Navigate to participant info page
    navigate(`/group-assessment-link/${token}/step2`)
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
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">
                {testData.title || "Group Assessment"}
              </h1>
              
              <p className="text-sm text-gray-600 mb-2">
                {linkData.groupName}
              </p>
              
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Please select your role to continue with the assessment.
              </p>
              
              <div className="space-y-3 mb-6">
                {linkData.perspectives && linkData.perspectives.length > 0 ? (
                  linkData.perspectives.map((perspective, index) => {
                    const isSelected = selectedPerspective === perspective.perspectiveName;
                    const isDisabled = perspective.maxAttempts && perspective.currentAttempts >= perspective.maxAttempts;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => !isDisabled && handleSelectRole(perspective.perspectiveName)}
                        disabled={isDisabled}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? 'border-mh-green bg-green-50'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 bg-white hover:border-mh-green hover:bg-green-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isSelected ? 'bg-mh-green text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              <UserCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className={`font-medium ${isSelected ? 'text-mh-green' : 'text-gray-800'}`}>
                                {perspective.perspectiveName}
                              </p>
                              {perspective.maxAttempts && (
                                <p className="text-xs text-gray-500">
                                  {perspective.currentAttempts} / {perspective.maxAttempts} completed
                                </p>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-mh-green flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {isDisabled && (
                          <p className="text-xs text-red-500 mt-2 ml-13">Maximum attempts reached</p>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-sm">No perspectives available</p>
                )}
              </div>
              
              <button 
                onClick={handleContinue}
                disabled={!selectedPerspective}
                className={`w-full font-medium py-3 px-6 rounded-full transition-colors duration-200 ${
                  selectedPerspective
                    ? 'bg-mh-gradient hover:bg-green-800 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Invalid or expired group assessment link</p>
              <p className="text-sm text-gray-600">Please contact the organizer for a valid link.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupAssessmentRoleSelectionPage


