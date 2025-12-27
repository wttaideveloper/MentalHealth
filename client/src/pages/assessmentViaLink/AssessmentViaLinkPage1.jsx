import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Timer, Users } from 'lucide-react'
import assessmentLinkImg from '../../assets/images/Assesment-link.png'
import assLink1 from '../../assets/images/ass-link-1.png'

const AssessmentViaLinkPage1 = () => {
  const navigate = useNavigate()

  const handleStartNow = () => {
    navigate('/assessment-link/step2')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Background Image */}
      <div 
        className="w-1/2 flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${assessmentLinkImg})` }}
      >
        <img 
          src={assLink1} 
          alt="Assessment" 
          className="max-w-md w-full h-auto object-contain"
        />
      </div>

      {/* Right Side - Content */}
      <div className="w-1/2 bg-gray-50 flex items-center justify-center px-12">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Let's Begin Your Wellness Assessment
          </h1>
          
          <p className="text-md text-gray-600 mb-6 leading-relaxed">
            This assessment is part of an ongoing campaign organized by [Organization Name]. Please complete the test within the allotted time.
          </p>
          
          <div className="bg-[#DDEFE7] border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              Answer a set of short, research-based questions to help evaluate your mental well-being. Your responses are private and securely stored.
            </p>
          </div>
          
          <div className="flex items-center justify-around mb-8">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-blue-400" />
                <p className="text-sm text-gray-500">Campaign Ends In</p>
              </div>
              <p className="text-xs text-mh-green font-bold ml-6">2 Days 12 Hours</p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-rose-400" />
                <p className="text-sm text-gray-500">Participants</p>
              </div>
              <p className="text-xs font-bold text-mh-green ml-6">450 joined so far</p>
            </div>
          </div>
          
          <button 
            onClick={handleStartNow}
            className="w-full bg-mh-gradient hover:bg-green-800 text-white font-medium py-3 px-6 rounded-full transition-colors duration-200"
          >
            Start Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssessmentViaLinkPage1