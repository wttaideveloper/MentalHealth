import { useState, useEffect } from 'react';
import { Search, Filter, Star } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumb';
import { getAllAssessments } from '../../api/assessmentApi';
import f1 from '../../assets/images/f1.png'; // Fallback image

function AllAssessmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isUserContext = location.pathname.startsWith('/user');
  
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Fetch assessments on mount and when filters change
  useEffect(() => {
    fetchAssessments();
  }, [showFreeOnly]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      if (showFreeOnly) {
        params.free = 'true';
      }
      
      const response = await getAllAssessments(params);
      console.log('API Response:', response); // Debug log
      if (response.success) {
        const data = response.data || [];
        setAssessments(Array.isArray(data) ? data : []);
        if (data.length === 0) {
          console.log('No assessments found in database. Please create test data.');
        }
      } else {
        setAssessments([]);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load assessments');
      toast.error(err.response?.data?.message || 'Failed to load assessments');
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      fetchAssessments();
    }
  };

  const handleAssessmentClick = (testId) => {
    const route = isUserContext ? `/user/assessment-detail/${testId}` : `/assessment-detail/${testId}`;
    navigate(route);
  };

  const handleBuyNow = (e, testId) => {
    e.stopPropagation();
    navigate('/payment', { state: { testId } });
  };

  // Format price for display
  const formatPrice = (price, mrp) => {
    if (price === 0 || !price) return 'Free';
    if (mrp && mrp > price) {
      return { current: `$${price}`, original: `$${mrp}` };
    }
    return { current: `$${price}`, original: null };
  };

  // Get image URL or fallback
  const getImageUrl = (imageUrl) => {
    if (imageUrl) return imageUrl;
    return f1; // Fallback to default image
  };

  return (
    <section className="bg-mh-white py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <Breadcrumb isLoggedIn={isUserContext} />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-mh-dark">
            All Programs
          </h1>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
                className="input-field pl-14 pr-10 w-full sm:w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchAssessments();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-xl border bg-mh-green text-white flex items-center justify-center gap-2 text-sm hover:bg-green-700 transition-colors"
              >
                <Search size={16} /> Search
              </button>
            )}

            <button
              onClick={() => {
                setShowFreeOnly(!showFreeOnly);
              }}
              className={`px-4 py-2 rounded-xl border bg-mh-white flex items-center justify-center gap-2 text-sm hover:bg-gray-50 transition-colors ${
                showFreeOnly ? 'border-mh-green text-mh-green' : ''
              }`}
            >
              <Filter size={16} /> {showFreeOnly ? 'Show All' : 'Free Only'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green"></div>
              <p className="mt-4 text-gray-600">Loading assessments...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAssessments}
              className="px-6 py-2 bg-mh-green text-white rounded-full hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && assessments.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg mb-4">No assessments found</p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchAssessments();
                }}
                className="text-mh-green hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Assessments Grid */}
        {!loading && !error && assessments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {assessments.map((test) => {
              const priceInfo = formatPrice(test.price, test.mrp);
              return (
                <div
                  key={test._id}
                  onClick={() => handleAssessmentClick(test._id)}
                  className="bg-mh-light rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative">
                    <img
                      src={getImageUrl(test.imageUrl)}
                      alt={test.title}
                      className="w-full h-[180px] sm:h-[200px] object-cover"
                      onError={(e) => {
                        e.target.src = f1;
                      }}
                    />

                    {test.tag && (
                      <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-mh-white text-xs px-2 sm:px-3 py-1 rounded-full shadow">
                        {test.tag}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-semibold mb-2 text-sm sm:text-base">
                      {test.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed line-clamp-2">
                      {test.shortDescription || test.longDescription || 'No description available'}
                    </p>

                    {/* Rating - Placeholder for now */}
                    {test.popularityScore > 0 && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm mb-3 sm:mb-4">
                        <span className="flex items-center gap-1 text-mh-green font-semibold">
                          <Star size={14} className="fill-current" /> {test.popularityScore.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs sm:text-sm">
                        <span className="font-semibold">{priceInfo.current}</span>
                        {priceInfo.original && (
                          <span className="line-through text-gray-400 ml-2">{priceInfo.original}</span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleBuyNow(e, test._id)}
                        className="px-3 sm:px-5 py-2 rounded-full bg-mh-gradient text-mh-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        {test.price === 0 ? 'Start' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}

export default AllAssessmentsPage;
