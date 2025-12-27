import { useLocation } from 'react-router-dom';
import about1 from '../../assets/images/about1.png';
import about2 from '../../assets/images/about2.png';
import about3 from '../../assets/images/about3.png';
import { Mountain, Eye, Heart, Sparkles, Shield, Brain, Globe } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';

function AboutUsPage() {
  const location = useLocation();
  const isLoggedIn = location.pathname.startsWith('/user');
  
  return (
    <div className="bg-mh-white">
      {/* Breadcrumb */}
      <div className="bg-mh-gradient pt-6">
        <Breadcrumb isLoggedIn={isLoggedIn} variant="light" />
      </div>

      {/* HERO SECTION */}
      <section className="bg-mh-gradient py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-mh-white">

          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold mb-4 sm:mb-6 leading-tight">
            Helping You Understand Your Mind, <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>One Step at a Time
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base opacity-90 mb-8 sm:mb-12 lg:mb-14 px-2">
            We created this platform to make mental health support more
            approachable and easier to access. Through simple, research-based
            assessments, we help you gain clarity about your emotional well-being,
            behaviour patterns, and areas where you may need support.
          </p>

          {/* Image Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <img
              src={about1}
              alt="Mental health support"
              className="rounded-2xl sm:rounded-3xl h-[200px] sm:h-[220px] lg:h-[260px] w-full object-cover"
            />
            <img
              src={about2}
              alt="Professional guidance"
              className="rounded-2xl sm:rounded-3xl h-[200px] sm:h-[220px] lg:h-[260px] w-full object-cover"
            />
            <img
              src={about3}
              alt="Mental wellness journey"
              className="rounded-2xl sm:rounded-3xl h-[200px] sm:h-[220px] lg:h-[260px] w-full object-cover sm:col-span-2 lg:col-span-1"
            />
          </div>

        </div>

      </section>

      {/* MISSION & VISION */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">

          {/* Mission */}
          <div className="bg-mh-light rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-mh-green">
              <Mountain size={32} className="sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3">
              Our Mission
            </h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              To support individuals on their mental-wellness journey by offering
              simple, research-based tools that help them understand their emotions,
              behaviour, and attention patterns with compassion and clarity.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-mh-light rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-mh-green">
              <Eye size={32} className="sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3">
              Our Vision
            </h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              A world where everyone feels empowered to explore their mental
              health openly, access helpful insights easily, and receive the
              support they need without fear, shame, or confusion.
            </p>
          </div>

        </div>
      </section>

      {/* OUR VALUES */}
      <section className="pb-12 sm:pb-16 md:pb-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <h2 className="text-2xl sm:text-3xl font-semibold mb-8 sm:mb-10 lg:mb-12 text-center sm:text-left">
            Our Values
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">

            {/* Value Card */}
            <div className="bg-mh-light rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="mb-4 text-mh-green">
                <Heart size={28} className="sm:w-7 sm:h-7" />
              </div>
              <h4 className="font-semibold mb-3 text-base sm:text-lg">
                Compassion First
              </h4>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We design every experience with empathy, ensuring users
                feel safe, supported, and understood throughout their
                mental-health journey.
              </p>
            </div>

            <div className="bg-mh-light rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="mb-4 text-mh-green">
                <Sparkles size={28} className="sm:w-7 sm:h-7" />
              </div>
              <h4 className="font-semibold mb-3 text-base sm:text-lg">
                Clarity & Simplicity
              </h4>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Mental health can feel complex — our goal is to make
                understanding it simple, approachable, and easy to navigate.
              </p>
            </div>

            <div className="bg-mh-light rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="mb-4 text-mh-green">
                <Shield size={28} className="sm:w-7 sm:h-7" />
              </div>
              <h4 className="font-semibold mb-3 text-base sm:text-lg">
                Privacy You Can Trust
              </h4>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Your information stays secure, encrypted, and under your
                control. Confidentiality isn't optional — it's foundational.
              </p>
            </div>

            <div className="bg-mh-light rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <div className="mb-4 text-mh-green">
                <Brain size={28} className="sm:w-7 sm:h-7" />
              </div>
              <h4 className="font-semibold mb-3 text-base sm:text-lg">
                Empowering Early Insight
              </h4>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We believe early awareness creates better outcomes. Our tools
                help highlight patterns before they become overwhelming.
              </p>
            </div>

              <div className="bg-mh-light rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <div className="mb-4 text-mh-green">
                <Globe size={28} className="sm:w-7 sm:h-7" />
              </div>
              <h4 className="font-semibold mb-3 text-base sm:text-lg">
                Designed for Everyone
              </h4>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Whether you're an individual, a parent, or a psychologist,
                our platform adapts to your needs with accessibility at its core.
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}

export default AboutUsPage;