import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Calendar, ChevronDown, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import assessmentLinkImg from '../../assets/images/Assesment-link.png'
import assLink1 from '../../assets/images/ass-link-1.png'
import { startLinkAttempt, validateAssessmentLink } from '../../api/publicAssessmentLinkApi'
import { createStudentProfile, getStudents } from '../../api/groupAssessmentLinkApi'
import DatePicker from '../../components/DatePicker'

const AssessmentViaLinkPage2 = () => {
  const navigate = useNavigate()
  const { token } = useParams()
  
  // Student profile form (for Student role)
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    dateOfBirth: '',
    classGrade: '',
    school: '',
    parentName: '',
    consent: false
  })
  
  // Participant info form (for Parent/Teacher roles)
  const [participantFormData, setParticipantFormData] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    selectedStudentId: '',
    consent: false
  })
  
  const [loading, setLoading] = useState(false)
  const [linkData, setLinkData] = useState(null)
  const [selectedPerspective, setSelectedPerspective] = useState(null)
  const [isGroupAssessment, setIsGroupAssessment] = useState(false)
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Invalid assessment link')
      navigate('/')
    } else {
      loadLinkData()
    }
  }, [token, navigate])

  useEffect(() => {
    // Load students list ONLY for group assessment Parent/Teacher roles
    // Regular assessment links should NOT load students
    if (isGroupAssessment && selectedPerspective && selectedPerspective.toLowerCase() !== 'student') {
      loadStudents()
    } else if (!isGroupAssessment) {
      // For regular assessment links, clear students list
      setStudents([])
    }
  }, [token, isGroupAssessment, selectedPerspective])

  const loadLinkData = async () => {
    try {
      const response = await validateAssessmentLink(token)
      if (response.success && response.data) {
        setLinkData(response.data.link)
        setIsGroupAssessment(response.data.link.isGroupAssessment || false)
        
        // Get selected perspective from localStorage
        const storedPerspective = localStorage.getItem(`groupPerspective_${token}`)
        if (storedPerspective) {
          setSelectedPerspective(storedPerspective)
        }
      }
    } catch (err) {
      console.error('Error loading link data:', err)
      toast.error('Failed to load assessment link')
    }
  }

  const loadStudents = async () => {
    // Only load students for group assessments
    if (!isGroupAssessment) {
      setStudents([])
      return
    }
    
    try {
      setLoadingStudents(true)
      const response = await getStudents(token)
      if (response.success && response.data) {
        setStudents(response.data || [])
        if (response.data.length === 0) {
          toast.error('No students found. Student must complete the assessment first.', {
            duration: 6000
          })
        }
      }
    } catch (err) {
      console.error('Error loading students:', err)
      // Only show error for group assessments
      if (isGroupAssessment) {
        toast.error('Failed to load students list')
      }
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleStudentFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setStudentFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleParticipantFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setParticipantFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleStudentSubmit = async () => {
    if (!studentFormData.consent) {
      toast.error('Please accept the consent to continue')
      return
    }

    if (!studentFormData.name || !studentFormData.name.trim()) {
      toast.error('Please enter student name')
      return
    }

    if (!studentFormData.parentName || !studentFormData.parentName.trim()) {
      toast.error('Please enter parent name')
      return
    }

    if (!studentFormData.dateOfBirth) {
      toast.error('Please enter date of birth')
        return
      }

    if (!studentFormData.classGrade || !studentFormData.classGrade.trim()) {
      toast.error('Please enter class/grade')
      return
    }

    try {
      setLoading(true)
      
      // Create student profile
      const profileResponse = await createStudentProfile(token, {
        name: studentFormData.name.trim(),
        dateOfBirth: studentFormData.dateOfBirth,
        classGrade: studentFormData.classGrade.trim(),
        school: studentFormData.school ? studentFormData.school.trim() : '',
        parentName: studentFormData.parentName ? studentFormData.parentName.trim() : ''
      })

      if (!profileResponse.success) {
        toast.error(profileResponse.message || 'Failed to create student profile')
        return
      }

      const subjectId = profileResponse.data._id

      // Prepare participant info with subjectId
      const participantInfo = {
        name: studentFormData.name.trim(),
        dateOfBirth: studentFormData.dateOfBirth,
        subjectId: subjectId
      }

    localStorage.setItem(`linkParticipant_${token}`, JSON.stringify(participantInfo))

    // If payment is required, redirect to payment page
    if (linkData && linkData.linkType === 'paid' && linkData.price > 0) {
      navigate(`/assessment-link/${token}/payment`)
      return
    }

      // Start attempt
    const storedPerspective = localStorage.getItem(`groupPerspective_${token}`)
    const perspective = storedPerspective || null

      const attemptResponse = await startLinkAttempt(token, participantInfo, perspective)
      
      if (attemptResponse.success && attemptResponse.data?.attempt) {
        const attemptId = attemptResponse.data.attempt._id
        localStorage.setItem(`linkAttempt_${token}`, attemptId)
        if (storedPerspective) {
          localStorage.removeItem(`groupPerspective_${token}`)
        }
        navigate(`/assessment-link/${token}/test/${attemptId}`)
      } else {
        toast.error(attemptResponse.message || 'Failed to start assessment')
      }
    } catch (err) {
      console.error('Error creating student profile:', err)
      const errorMessage = err.response?.data?.message || 'Failed to create student profile'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleParticipantSubmit = async () => {
    if (!participantFormData.consent) {
      toast.error('Please accept the consent to continue')
      return
    }

    if (!participantFormData.fullName || !participantFormData.fullName.trim()) {
      toast.error('Please enter your name')
      return
    }

    // Only require student selection for group assessment Parent/Teacher roles
    if (isParentOrTeacherRole && !participantFormData.selectedStudentId) {
      toast.error('Please select a student')
      return
    }

    try {
      setLoading(true)
      
      // Prepare participant info
      // For Group Assessment Parent/Teacher: name and subjectId
      // For Regular Assessment Links: name, email, dateOfBirth, gender (old flow)
      const participantInfo = isParentOrTeacherRole
        ? {
            name: participantFormData.fullName.trim(),
            subjectId: participantFormData.selectedStudentId
          }
        : {
            name: participantFormData.fullName.trim(),
            email: participantFormData.email || undefined,
            dateOfBirth: participantFormData.dateOfBirth || undefined,
            gender: participantFormData.gender || undefined
          }

      localStorage.setItem(`linkParticipant_${token}`, JSON.stringify(participantInfo))

      // If payment is required, redirect to payment page
      if (linkData && linkData.linkType === 'paid' && linkData.price > 0) {
        navigate(`/assessment-link/${token}/payment`)
        return
      }

      // Start attempt
      // Only pass perspective for group assessments
      const storedPerspective = localStorage.getItem(`groupPerspective_${token}`)
      const perspective = isGroupAssessment ? (storedPerspective || null) : null

      const attemptResponse = await startLinkAttempt(token, participantInfo, perspective)
      
      if (attemptResponse.success && attemptResponse.data?.attempt) {
        const attemptId = attemptResponse.data.attempt._id
        localStorage.setItem(`linkAttempt_${token}`, attemptId)
        if (storedPerspective) {
          localStorage.removeItem(`groupPerspective_${token}`)
        }
        navigate(`/assessment-link/${token}/test/${attemptId}`)
      } else {
        toast.error(attemptResponse.message || 'Failed to start assessment')
      }
    } catch (err) {
      console.error('Error starting attempt:', err)
      const errorMessage = err.response?.data?.message || 'Failed to start assessment'
      
      if (err.response?.status === 400 && errorMessage.toLowerCase().includes('eligible')) {
        toast.error(errorMessage, { duration: 6000 })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const isStudentRole = isGroupAssessment && selectedPerspective?.toLowerCase() === 'student'
  const isParentOrTeacherRole = isGroupAssessment && selectedPerspective && selectedPerspective.toLowerCase() !== 'student'

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
            {isStudentRole ? 'Create Student Profile' : 'Before You Begin'}
          </h1>
          
          {/* Student Role Form */}
          {isStudentRole ? (
            <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
                  name="name"
                  value={studentFormData.name}
                  onChange={handleStudentFormChange}
                  placeholder="Enter student name"
              className="w-full px-4 py-3 bg-gray-200 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
            />
          </div>

              <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                  name="parentName"
                  value={studentFormData.parentName}
                  onChange={handleStudentFormChange}
                  placeholder="Enter parent name"
                className="w-full px-4 py-3 bg-gray-200 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
                </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={studentFormData.dateOfBirth}
                  onChange={handleStudentFormChange}
                  max={new Date().toISOString().split('T')[0]}
                  placeholder="Select date of birth"
                  className="w-full px-4 py-3 bg-gray-200 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  name="dateOfBirth"
                />
            </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class / Grade <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
                  name="classGrade"
                  value={studentFormData.classGrade}
                  onChange={handleStudentFormChange}
                  placeholder="e.g., Grade 5, Class 10"
              className="w-full px-4 py-3 bg-gray-200 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
            />
          </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School / College (Optional)
                </label>
                <input
                  type="text"
                  name="school"
                  value={studentFormData.school}
                  onChange={handleStudentFormChange}
                  placeholder="Enter school or college name"
                  className="w-full px-4 py-3 bg-gray-200 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </>
          ) : (
            /* Regular Assessment Link Form OR Parent/Teacher Role Form for Group Assessment */
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isParentOrTeacherRole 
                    ? (selectedPerspective === 'Parent' ? 'Parent Name' : selectedPerspective === 'Teacher' ? 'Teacher Name' : 'Full Name')
                    : 'Full Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={participantFormData.fullName}
                  onChange={handleParticipantFormChange}
                  placeholder={`Enter ${isParentOrTeacherRole ? (selectedPerspective?.toLowerCase() || 'your') : 'your'} name`}
                  className="w-full px-4 py-3 bg-gray-200 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Student Selection - ONLY for Group Assessment Parent/Teacher roles */}
              {isParentOrTeacherRole && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student <span className="text-red-500">*</span>
                  </label>
                  {loadingStudents ? (
                    <div className="w-full px-4 py-3 bg-gray-200 rounded-lg text-gray-500">
                      Loading students...
                    </div>
                  ) : students.length === 0 ? (
                    <div className="w-full px-4 py-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">No students found. Student must complete the assessment first.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        name="selectedStudentId"
                        value={participantFormData.selectedStudentId}
                        onChange={handleParticipantFormChange}
                        className="w-full px-4 py-3 pr-10 bg-gray-200 border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                        required
                      >
                        <option value="">Select a student</option>
                        {students.map((student) => (
                          <option key={student._id} value={student._id}>
                            {student.name} {student.classGrade ? `- ${student.classGrade}` : ''} {student.school ? `(${student.school})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  )}
                </div>
              )}

              {/* Regular Assessment Link Fields - Only show for non-group assessments */}
              {!isGroupAssessment && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={participantFormData.email}
                      onChange={handleParticipantFormChange}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-gray-200 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <DatePicker
                      value={participantFormData.dateOfBirth}
                      onChange={handleParticipantFormChange}
                      max={new Date().toISOString().split('T')[0]}
                      placeholder="Select date of birth"
                      className="w-full px-4 py-3 bg-gray-200 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      name="dateOfBirth"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        name="gender"
                        value={participantFormData.gender}
                        onChange={handleParticipantFormChange}
                        className="w-full px-4 py-3 pr-10 bg-gray-200 border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Payment Section for Paid Links */}
          {linkData && linkData.linkType === 'paid' && linkData.price > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Payment Required</h3>
                </div>
                <div className="text-right">
                  {linkData.testId?.price && linkData.testId.price > linkData.price && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500 line-through">₹{linkData.testId.price}</span>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                        {Math.round(((linkData.testId.price - linkData.price) / linkData.testId.price) * 100)}% OFF
                      </span>
                    </div>
                  )}
                  <span className="text-xl font-bold text-blue-600">₹{linkData.price}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                This assessment requires payment to proceed. Please complete the payment to continue.
              </p>
              {linkData.testId?.title && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Assessment:</span> {linkData.testId.title}
                  </p>
                  {linkData.campaignName && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Campaign:</span> {linkData.campaignName}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Consent Checkbox */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  name="consent"
                  checked={isStudentRole ? studentFormData.consent : participantFormData.consent}
                  onChange={isStudentRole ? handleStudentFormChange : handleParticipantFormChange}
                  className="custom-checkbox"
                />
              </div>
              <div className="flex items-start space-x-2">
                <Lock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <label 
                    className="text-sm text-gray-800 font-medium leading-relaxed cursor-pointer" 
                    onClick={() => {
                      if (isStudentRole) {
                        setStudentFormData(prev => ({ ...prev, consent: !prev.consent }))
                      } else {
                        setParticipantFormData(prev => ({ ...prev, consent: !prev.consent }))
                      }
                    }}
                  >
                    I agree to participate in this assessment and consent to data collection
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Your information is secure and confidential. Read our{' '}
                    <a href="/privacy" target="_blank" className="text-mh-green hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <button 
            onClick={isStudentRole ? handleStudentSubmit : handleParticipantSubmit}
            disabled={
              (isStudentRole ? !studentFormData.consent : !participantFormData.consent) || 
              loading || 
              (isParentOrTeacherRole && students.length === 0)
            }
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
