import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Lock, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import assessmentLinkImg from '../../assets/images/Assesment-link.png'
import assLink1 from '../../assets/images/ass-link-1.png'
import { validateAssessmentLink, startLinkAttempt, createLinkPaymentOrder, verifyLinkPayment } from '../../api/publicAssessmentLinkApi'

const AssessmentViaLinkPaymentPage = () => {
  const navigate = useNavigate()
  const { token } = useParams()
  const [linkData, setLinkData] = useState(null)
  const [testData, setTestData] = useState(null)
  const [participantInfo, setParticipantInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Invalid assessment link')
      navigate('/')
    } else {
      loadData()
    }
  }, [token, navigate])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get link and test data
      const response = await validateAssessmentLink(token)
      if (response.success && response.data) {
        setLinkData(response.data.link)
        setTestData(response.data.test)
      }

      // Get participant info from localStorage (stored in step2)
      const storedInfo = localStorage.getItem(`linkParticipant_${token}`)
      if (storedInfo) {
        setParticipantInfo(JSON.parse(storedInfo))
      } else {
        toast.error('Participant information not found')
        navigate(`/assessment-link/${token}/step2`)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      toast.error('Failed to load payment information')
    } finally {
      setLoading(false)
    }
  }

  const handlePayNow = async () => {
    if (!participantInfo || !participantInfo.email) {
      toast.error('Participant email is required')
      return
    }

    if (!linkData || linkData.linkType !== 'paid' || !linkData.price) {
      toast.error('Invalid payment link')
      return
    }

    try {
      setProcessing(true)
      
      // TEMPORARY: Create mock payment for testing
      // In production, this would integrate with Razorpay payment gateway
      let orderId = `mock_order_${Date.now()}`
      
      try {
        // Try to create payment order (may fail if Razorpay not configured)
        const orderResponse = await createLinkPaymentOrder(
          token,
          participantInfo.email,
          participantInfo.name || ''
        )

        if (orderResponse.success && orderResponse.data) {
          orderId = orderResponse.data.orderId || orderId
        }
      } catch (paymentErr) {
        // If payment order creation fails (e.g., Razorpay not configured), continue with mock order
        console.warn('Payment order creation failed, using mock order for testing:', paymentErr.message)
      }
      
      // Mock payment verification - mark as paid for testing
      // In production, this would be done after actual Razorpay payment
      try {
        const mockPaymentId = `mock_pay_${Date.now()}`
        const verifyResponse = await verifyLinkPayment(
          token,
          mockPaymentId,
          orderId,
          participantInfo.email
        )

        if (!verifyResponse.success) {
          throw new Error('Payment verification failed')
        }
        
        toast.success('Payment verified successfully')
      } catch (verifyErr) {
        console.error('Payment verification error:', verifyErr)
        // Continue anyway - the verifyPayment endpoint should create the record if it doesn't exist
      }
      
      // Wait a moment to ensure payment record is saved
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Get perspective for group assessments
      const storedPerspective = localStorage.getItem(`groupPerspective_${token}`)
      const perspective = storedPerspective || null
      
      // Now start the attempt
      const response = await startLinkAttempt(token, participantInfo, perspective)
      
      if (response.success && response.data?.attempt) {
        const attemptId = response.data.attempt._id
        // Store attemptId in localStorage for the test page
        localStorage.setItem(`linkAttempt_${token}`, attemptId)
        // Clear stored perspective after use
        if (storedPerspective) {
          localStorage.removeItem(`groupPerspective_${token}`)
        }
        // Navigate to test page with token and attemptId
        navigate(`/assessment-link/${token}/test/${attemptId}`)
      } else {
        toast.error(response.message || 'Failed to start assessment')
      }
    } catch (err) {
      console.error('Error starting attempt:', err)
      const errorMessage = err.response?.data?.message || 'Failed to start assessment'
      
      // If payment is still required, show specific message
      if (err.response?.status === 402 || err.response?.data?.requiresPayment) {
        toast.error('Payment verification is still processing. Please wait a moment and try again.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleBack = () => {
    navigate(`/assessment-link/${token}/step2`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green mb-4"></div>
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    )
  }

  if (!linkData || !testData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Invalid or expired assessment link</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-mh-gradient text-white rounded-lg hover:opacity-90"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
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

      {/* Right Side - Payment Content */}
      <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center px-6 lg:px-12 py-8 lg:py-0">
        <div className="max-w-lg w-full">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-mh-green mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
            Complete Payment
          </h1>
          
          <p className="text-sm text-gray-600 mb-8">
            Please complete the payment to proceed with the assessment
          </p>

          {/* Assessment Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-4">
              {testData.imageUrl && (
                <img 
                  src={testData.imageUrl} 
                  alt={testData.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {testData.title}
                </h3>
                {linkData.campaignName && (
                  <p className="text-sm text-gray-600 mb-2">
                    {linkData.campaignName}
                  </p>
                )}
                {testData.shortDescription && (
                  <p className="text-sm text-gray-500">
                    {testData.shortDescription}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
            
            <div className="space-y-3 mb-4">
              {/* Show original price if different */}
              {testData.price && testData.price > linkData.price && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Original Price</span>
                  <span className="text-gray-500 line-through">₹{testData.price}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {testData.price && testData.price > linkData.price ? 'Special Price' : 'Assessment Fee'}
                </span>
                <div className="flex items-center gap-2">
                  {testData.price && testData.price > linkData.price && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                      {Math.round(((testData.price - linkData.price) / testData.price) * 100)}% OFF
                    </span>
                  )}
                  <span className="text-gray-900 font-medium">₹{linkData.price}</span>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-mh-green">₹{linkData.price}</span>
                </div>
              </div>
            </div>

            {/* Payment Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    Secure Payment
                  </p>
                  <p className="text-xs text-blue-700">
                    Your payment information is secure and encrypted. This is a temporary payment flow for testing purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Participant Info */}
          {participantInfo && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-600 mb-2">Payment for:</p>
              <p className="text-sm font-medium text-gray-900">
                {participantInfo.name || 'Anonymous'}
              </p>
              {participantInfo.email && (
                <p className="text-xs text-gray-600 mt-1">
                  {participantInfo.email}
                </p>
              )}
            </div>
          )}

          {/* Pay Now Button */}
          <button
            onClick={handlePayNow}
            disabled={processing}
            className="w-full bg-mh-gradient disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-full transition-colors duration-200 text-base flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Pay Now - ₹{linkData.price}</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By proceeding, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default AssessmentViaLinkPaymentPage

