import f1 from '../../assets/images/f1.png';
import f2 from '../../assets/images/f2.png';
import f3 from '../../assets/images/f3.png';
import { Search, Filter, Star } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';

function AllAssessmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isUserContext = location.pathname.startsWith('/user');
  
  const assessments = [
    { img: f1, id: 1 },
    { img: f2, id: 2 },
    { img: f3, id: 3 },
    { img: f2, id: 4 },
    { img: f3, id: 5 },
    { img: f1, id: 6 },
  ];

  const handleAssessmentClick = (id) => {
    const route = isUserContext ? `/user/assessment-detail/${id}` : `/assessment-detail/${id}`;
    navigate(route);
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
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="input-field pl-14 pr-4 w-full sm:w-64"
              />

            </div>


            <button className="px-4 py-2 rounded-xl border bg-mh-white flex items-center justify-center gap-2 text-sm hover:bg-gray-50 transition-colors">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

          {assessments.map((item, index) => (
            <div
              key={index}
              onClick={() => handleAssessmentClick(item.id)}
              className="bg-mh-light rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
            >
              {/* Image */}
              <div className="relative">
                <img
                  src={item.img}
                  alt="Assessment"
                  className="w-full h-[180px] sm:h-[200px] object-cover"
                />

                <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-mh-white text-xs px-2 sm:px-3 py-1 rounded-full shadow">
                  Research-Based
                </span>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">
                  Anxiety Assessment
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                  A quick screening that helps identify symptoms of excessive
                  worry, tension, and emotional overwhelm.
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 text-xs sm:text-sm mb-3 sm:mb-4">
                  <span className="flex items-center gap-1 text-mh-green font-semibold">
                    <Star size={14} className="fill-current" /> 4.9
                  </span>
                  <span className="text-gray-500">190 Reviews</span>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm">
                    <span className="font-semibold">$150</span>
                    <span className="line-through text-gray-400 ml-2">$300</span>
                  </div>

                  <button className="px-3 sm:px-5 py-2 rounded-full bg-mh-gradient text-mh-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity">
                    Buy Now
                  </button>
                </div>

              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default AllAssessmentsPage;
