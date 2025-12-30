import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Star } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';
import { getAssessmentById, getAllAssessments } from '../../api/assessmentApi';
import f1 from '../../assets/images/f1.png'; // Fallback image
import f2 from '../../assets/images/f2.png'; // Fallback image

function AssessmentDetailPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeFaq, setActiveFaq] = useState(0);
  const [test, setTest] = useState(null);
  const [featuredTests, setFeaturedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { id: testId } = useParams();
  const isLoggedIn = location.pathname.startsWith('/user');

  useEffect(() => {
    if (testId) {
      fetchTestDetails();
      fetchFeaturedTests();
    }
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAssessmentById(testId);
      if (response.success && response.data) {
        setTest(response.data);
      } else {
        setError('Test not found');
        toast.error('Test not found');
      }
    } catch (err) {
      console.error('Error fetching test details:', err);
      setError(err.response?.data?.message || 'Failed to load test details');
      toast.error(err.response?.data?.message || 'Failed to load test details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedTests = async () => {
    try {
      // Fetch a few tests for the sidebar (excluding current test)
      const response = await getAllAssessments({ limit: 3, popularity: 'true' });
      if (response.success && response.data) {
        // Filter out current test
        const filtered = response.data.filter(t => t._id !== testId).slice(0, 2);
        setFeaturedTests(filtered);
      }
    } catch (err) {
      console.error('Error fetching featured tests:', err);
      // Don't show error for featured tests, just leave empty
    }
  };

  const handleBuyNow = () => {
    if (test?.price === 0 || !test?.price) {
      // Free test - navigate to start attempt
      navigate(`/assessment-test/${testId}`);
    } else {
      navigate('/payment', { state: { testId } });
    }
  };

  // Format price for display
  const formatPrice = (price, mrp) => {
    if (price === 0 || !price) return { current: 'Free', original: null };
    if (mrp && mrp > price) {
      return { current: `$${price}`, original: `$${mrp}` };
    }
    return { current: `$${price}`, original: null };
  };

  // Get image URL or fallback
  const getImageUrl = (imageUrl) => {
    if (imageUrl) return imageUrl;
    return f2; // Fallback to default image
  };

  const faqs = [
    {
      q: 'Question text goes here',
      a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.',
    },
    { q: 'Question text goes here', a: '' },
    { q: 'Question text goes here', a: '' },
    { q: 'Question text goes here', a: '' },
  ];

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green"></div>
          <p className="mt-4 text-gray-600">Loading assessment details...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Test not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-mh-green text-white rounded-full hover:bg-green-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const priceInfo = formatPrice(test.price, test.mrp);

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <Breadcrumb isLoggedIn={isLoggedIn} assessmentName={test.title} />

      {/* TOP SECTION - Purple Background */}
      <div className="bg-[#D5DCEE] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Image */}
            <div>
              <img
                src={getImageUrl(test.imageUrl)}
                alt={test.title}
                className="rounded-2xl w-full h-[300px] object-cover"
                onError={(e) => {
                  e.target.src = f2;
                }}
              />
            </div>

            {/* Info */}
            <div>
              <h1 className="text-3xl font-bold mb-4 text-gray-900">
                {test.title}
              </h1>

              <p className="text-gray-600 mb-8 leading-relaxed">
                {test.shortDescription || test.longDescription || 'No description available'}
              </p>

              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{priceInfo.current}</span>
                  {priceInfo.original && (
                    <span className="text-lg line-through text-gray-400">{priceInfo.original}</span>
                  )}
                  <button 
                    onClick={handleBuyNow}
                    className="px-6 py-2 rounded-full bg-mh-gradient text-white font-semibold hover:bg-mh-green transition-colors"
                  >
                    {test.price === 0 ? 'Start Free' : 'Buy Now'}
                  </button>
                </div>
                {test.price > 0 && (
                  <p className="text-xs text-gray-500">(inclusive of all taxes)</p>
                )}
              </div>

              {/* Meta Info */}
              <div className="bg-white rounded-xl p-4 inline-flex gap-8">
                <div>
                  <svg className="w-4 h-4 text-mh-green mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>

                  <p className="text-sm text-gray-800 font-semibold mb-1">Duration</p>
                  <p className="text-gray-500">
                    {test.durationMinutesMin && test.durationMinutesMax
                      ? `${test.durationMinutesMin}-${test.durationMinutesMax} minutes`
                      : test.durationMinutesMin
                      ? `${test.durationMinutesMin} minutes`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <svg className="w-4 h-4 text-mh-green mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-800 font-semibold mb-1">Questions</p>
                  <p className="text-gray-500">{test.questionsCount || 'N/A'} Questions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* LEFT SIDEBAR - Featured Assessments */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-gray-900">Featured Assessments</h3>

            <div className="space-y-4">
              {featuredTests.length > 0 ? (
                featuredTests.map((featuredTest) => {
                  const featuredPriceInfo = formatPrice(featuredTest.price, featuredTest.mrp);
                  return (
                    <div
                      key={featuredTest._id}
                      onClick={() => navigate(`/assessment-detail/${featuredTest._id}`)}
                      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        <img
                          src={getImageUrl(featuredTest.imageUrl)}
                          alt={featuredTest.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            e.target.src = f1;
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-2 text-gray-900 leading-tight">
                            {featuredTest.title}
                          </h4>
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                            {featuredTest.shortDescription || 'No description available'}
                          </p>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{featuredPriceInfo.current}</span>
                            {featuredPriceInfo.original && (
                              <span className="text-xs text-gray-400 line-through">{featuredPriceInfo.original}</span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/assessment-detail/${featuredTest._id}`);
                              }}
                              className="px-4 py-1.5 text-xs rounded-full bg-mh-gradient text-white font-semibold hover:bg-mh-green transition-colors whitespace-nowrap"
                            >
                              {featuredTest.price === 0 ? 'Start' : 'View'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No featured assessments available</p>
              )}
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-2">

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200 mb-8">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'faqs', label: 'FAQs' },
                { key: 'reviews', label: 'Reviews' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 font-medium transition-colors ${activeTab === tab.key
                    ? 'border-b-2 border-mh-green text-mh-green'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">About Assessment</h3>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {test.longDescription || test.shortDescription || 'No detailed description available for this assessment.'}
                </div>
              </div>
            )}

            {/* FAQS TAB */}
            {activeTab === 'faqs' && (
              <div>
                <h3 className="text-lg font-semibold mb-6 text-gray-900">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  {faqs.map((item, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
                        onClick={() => setActiveFaq(activeFaq === i ? -1 : i)}
                      >
                        <span className="font-medium text-gray-900">{item.q}</span>
                        <span className="text-xl text-gray-400 font-light">
                          {activeFaq === i ? '−' : '+'}
                        </span>
                      </button>
                      {activeFaq === i && item.a && (
                        <div className="px-6 pb-4 border-t border-gray-100">
                          <p className="text-sm text-gray-600 leading-relaxed pt-4">
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-semibold mb-6 text-gray-900">Reviews</h3>

                {/* Rating Summary */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-mh-green text-mh-green" />
                    <span className="text-2xl font-bold text-mh-green">4.9</span>
                  </div>
                  <span className="text-sm text-gray-500">190 Reviews</span>

                  {/* Rating Bars */}
                  <div className="flex-1 max-w-xs">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <div key={rating} className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 w-3">{rating}</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-mh-green rounded-full"
                            style={{ width: rating === 5 ? '80%' : rating === 4 ? '15%' : '5%' }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-6">
                  {[
                    { name: 'Name Surname', company: 'Company name', date: '10 Nov 2019' },
                    { name: 'Name Surname', company: 'Company name', date: '10 Nov 2019' }
                  ].map((review, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-mh-green font-semibold text-sm">
                              {review.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{review.name}</p>
                            <p className="text-xs text-gray-500">{review.company}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{review.date}</span>
                      </div>

                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className="w-4 h-4 fill-mh-green text-mh-green" />
                        ))}
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* BOTTOM STICKY CTA */}
      <div className="border-t border-gray-200 bg-white py-4 sticky bottom-0 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div>
            <span className="font-bold text-lg text-gray-900">{test.title}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-semibold text-gray-900">{priceInfo.current}</span>
              {priceInfo.original && (
                <span className="text-sm line-through text-gray-400">{priceInfo.original}</span>
              )}
              {test.price > 0 && (
                <span className="text-xs text-gray-500">(inclusive of all taxes)</span>
              )}
            </div>
          </div>
          <button 
            onClick={handleBuyNow}
            className="px-8 py-3 rounded-full bg-mh-gradient text-white font-semibold hover:bg-mh-green transition-colors"
          >
            {test.price === 0 ? 'Start Free' : 'Buy Now'}
          </button>
        </div>
      </div>

    </div>
  );
}

export default AssessmentDetailPage;
