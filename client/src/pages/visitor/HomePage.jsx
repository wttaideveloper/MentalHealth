import { useState, useLayoutEffect, useRef } from 'react';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";


import heroImage from '../../assets/images/hero-home.png';
import f1 from '../../assets/images/f1.png'
import f2 from '../../assets/images/f2.png'
import f3 from '../../assets/images/f3.png'
import serviceImage from '../../assets/images/service-img.png'
import assessmentMatterImage from '../../assets/images/asses-m.png'
import soukya from '../../assets/images/soukya.png'

gsap.registerPlugin(ScrollTrigger);

function HomePage() {

  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  const cards = [
    {
      title: "Anxiety Assessment",
      description: "A quick screening that helps identify symptoms of excessive worry, tension, and emotional overwhelm.",
      duration: "10–12 minutes",
      questions: "20 questions",
      image: f1,
      bg: "#FBEBDC"
    },
    {
      title: "Depression Screening",
      description: "Evaluates mood patterns, motivation levels, and emotional well-being to detect signs of low mood or persistent sadness.",
      duration: "10–12 minutes",
      questions: "20 questions",
      image: f2,
      bg: "#D5DCEE"
    },
    {
      title: "ADHD / Attention Difficulty Screening",
      description: "Assesses focus, impulsivity, and attention-related challenges to support early understanding of ADHD-like symptoms.",
      duration: "10–12 minutes",
      questions: "20 questions",
      image: f3,
      bg: "#F7E3EE"
    },
  ];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const els = cardsRef.current;

      // Setup with better initial positioning
      gsap.set(els, { 
        position: "absolute", 
        inset: 0,
        transformOrigin: "center center"
      });
      
      // Initial states - cards stacked with depth
      gsap.set(els[0], { 
        y: 0, 
        scale: 1, 
        opacity: 1,
        zIndex: 30,
        rotateX: 0,
        filter: "blur(0px)"
      });
      
      gsap.set(els[1], { 
        y: 40, 
        scale: 0.96, 
        opacity: 0.7,
        zIndex: 20,
        rotateX: 3,
        filter: "blur(1px)"
      });
      
      gsap.set(els[2], { 
        y: 80, 
        scale: 0.92, 
        opacity: 0.4,
        zIndex: 10,
        rotateX: 6,
        filter: "blur(2px)"
      });

      // Enhanced transition function with smoother animation
      const createTransition = (prevIndex, nextIndex) => {
        const tl = gsap.timeline();
        
        // Phase 1: Current card lifts and fades out
        tl.to(els[prevIndex], {
          y: -80,
          scale: 0.9,
          opacity: 0.5,
          rotateX: -8,
          filter: "blur(4px)",
          duration: 0.5,
          ease: "power3.in",
        })
        // Phase 2: Complete exit
        .to(els[prevIndex], {
          y: -150,
          scale: 0.85,
          opacity: 0,
          rotateX: -15,
          filter: "blur(8px)",
          duration: 0.5,
          ease: "power3.inOut",
        });

        // Next card comes to front with spring-like motion
        tl.to(els[nextIndex], {
          y: 0,
          opacity: 1,
          scale: 1,
          rotateX: 0,
          zIndex: 30,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
        }, "<0.2");

        // Card after next moves up smoothly in stack
        if (nextIndex + 1 < els.length) {
          tl.to(els[nextIndex + 1], {
            y: 40,
            scale: 0.96,
            opacity: 0.7,
            rotateX: 3,
            filter: "blur(1px)",
            duration: 0.9,
            ease: "power2.out",
          }, "<0.1");
        }

        // Breathing pause between transitions
        tl.to({}, { duration: 0.6 });

        return tl;
      };

      // Main timeline with optimized scroll control
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=450%",
          pin: true,
          scrub: 1.8,
          anticipatePin: 1,
        },
      });

      // Add transitions with refined spacing
      tl.add(createTransition(0, 1), "+=0.5");
      tl.add(createTransition(1, 2), "+=0.5");
      
      // Final hold
      tl.to({}, { duration: 1.5 });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const assessments = [
    { img: f1 },
    { img: f2 },
    { img: f3 },
    { img: f2 },
    { img: f3 },
    { img: f1 },
  ];

  const [activeIndex, setActiveIndex] = useState(-1);

  const faqs = [
    {
      question: 'Question text goes here',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.',
    },
    {
      question: 'Question text goes here',
      answer:
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    },
    {
      question: 'Question text goes here',
      answer:
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.',
    },
    {
      question: 'Question text goes here',
      answer:
        'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt.',
    },
    {
      question: 'Question text goes here',
      answer:
        'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias.',
    },
  ];

  return (
    <>
      <section className="bg-[#F8F8F0] py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* LEFT CONTENT */}
            <div>
              {/* Pills */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                <span className="px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm bg-[#FBEBDC] ">
                  Reassurance
                </span>
                <span className="px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm  bg-[#D5DCEE]">
                  Privacy
                </span>
                <span className="px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm  bg-[#DFF7EA]">
                  Confidentiality
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight text-mh-dark mb-4 sm:mb-6">
                Understand Your <br className="hidden sm:block" />
                <span className="inline-block bg-[#C5E9DB] px-3 py-1 rounded-xl mt-1">
                  Mental Health
                </span>
                <br className="hidden sm:block" />
                with Science-Backed <br className="hidden sm:block" />
                Assessments
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-base sm:text-lg mb-6 sm:mb-8">
                Take clinically aligned mental health assessments and receive a clear,
                private report you can confidently share with a professional.
              </p>

              {/* Button */}
              <button className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-mh-gradient text-mh-white text-sm sm:text-base font-semibold hover:opacity-90 transition">
                Explore Assessments
              </button>
            </div>


            {/* RIGHT IMAGE CARD */}
            <div className="relative flex justify-center">

              {/* Image container */}
              <div className="relative rounded-2xl md:rounded-[32px] overflow-hidden w-full max-w-full">
                <img
                  src={heroImage}
                  alt="Mental health wellbeing"
                  className="w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[520px] object-cover"
                />
              </div>



            </div>
          </div>
        </div>
      </section>

      {/* Featured Assessments Section */}
      <section className="bg-white pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-mh-dark mb-3 sm:mb-4">
              Featured Assessments
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mx-auto">
              Take clinically aligned mental health assessments and receive a clear, <br className="hidden sm:block" />
              private report you can confidently share with a professional.
            </p>
          </div>
        </div>
      </section>

      <section ref={sectionRef} className="relative h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-center">
          <div className="relative w-full h-[70vh]" style={{ perspective: "1200px" }}>
            {cards.map((card, i) => (
              <div
                key={i}
                ref={(el) => (cardsRef.current[i] = el)}
                className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-center"
                style={{ background: card.bg }}
              >
                {/* Left */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 max-w-md">
                    {card.description}
                  </p>

                  <div className="flex gap-6 sm:gap-8 lg:gap-10 mb-4 sm:mb-6">
                    <div>
                      <svg className="w-4 h-4 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs sm:text-sm text-gray-900 font-bold mb-1">Duration</p>
                      <p className="text-sm sm:text-base font-medium text-gray-700">{card.duration}</p>
                    </div>
                    <div>
                      <svg className="w-4 h-4 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs sm:text-sm text-gray-900 font-bold mb-1">Questions</p>
                      <p className="text-sm sm:text-base font-medium text-gray-700">{card.questions}</p>
                    </div>
                  </div>

                  <button className="px-6 py-2 rounded-full bg-gray-900 text-white text-sm">
                    View Details
                  </button>
                </div>

                {/* Right */}
                <div className="relative">
                  <span className="absolute top-4 left-4 bg-white text-xs px-3 py-1 rounded-full shadow">
                    Research-Based
                  </span>
                  <img
                    src={card.image}
                    alt={card.title}
                    className="rounded-xl sm:rounded-2xl w-full h-[200px] sm:h-[250px] lg:h-[300px] object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> 

      {/* Our Service Section  */}


      <section className="bg-mh-light py-12 md:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Section Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-mh-dark mb-8 sm:mb-10 lg:mb-12">
            Our Services
          </h2>

          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">

            {/* LEFT LARGE CARD */}
            <div className="lg:col-span-2 bg-mh-white rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
              <img
                src={serviceImage}
                alt="Psychologist support"
                className="w-full h-[200px] sm:h-[250px] md:h-[280px] lg:h-[320px] object-cover"
              />

              <div className="p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                  Psychologist & Psychiatrist Network
                </h3>

                <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 max-w-xl">
                  Connect with trusted mental-health experts for guidance,
                  diagnosis, therapy, and long-term support tailored to your needs.
                </p>

                <button className="px-6 py-2 rounded-full border border-mh-green text-mh-green text-sm font-semibold hover:bg-mh-green hover:text-mh-white transition">
                  View Details
                </button>
              </div>
            </div>

            {/* RIGHT STACKED CARDS */}
            <div className="space-y-6 sm:space-y-8">

              {/* Card 1 */}
              <div className="bg-mh-white rounded-2xl sm:rounded-3xl shadow-sm p-6 sm:p-8">
                <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                  Meditation & Wellness Retreats
                </h4>

                <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm">
                  Experience guided meditation, mindfulness workshops,
                  and rejuvenating retreats designed to help you reset,
                  relax, and restore balance.
                </p>

                <button className="px-5 py-2 rounded-full border border-mh-green text-mh-green text-sm font-semibold hover:bg-mh-green hover:text-mh-white transition">
                  View Details
                </button>
              </div>

              {/* Card 2 */}
              <div className="bg-mh-white rounded-2xl sm:rounded-3xl shadow-sm p-6 sm:p-8">
                <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                  Age-Focused Wellness Camps
                </h4>

                <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm">
                  Programs for teens, young adults, and seniors, addressing
                  unique mental health challenges through curated activities
                  and expert-led sessions.
                </p>

                <button className="px-5 py-2 rounded-full border border-mh-green text-mh-green text-sm font-semibold hover:bg-mh-green hover:text-mh-white transition">
                  View Details
                </button>
              </div>

            </div>
          </div>

          {/* Bottom CTA */}
          <div className="flex justify-center mt-8 sm:mt-12 lg:mt-14">
            <button className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-mh-gradient text-mh-white text-sm sm:text-base font-semibold hover:opacity-90 transition">
              Explore More
            </button>
          </div>

        </div>
      </section>

      {/* Our Assessments Section   */}


      <section className="bg-mh-white py-12 md:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Section Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-mh-dark mb-8 sm:mb-10 lg:mb-12">
            Our Assessment
          </h2>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {assessments.map((item, index) => (
              <div
                key={index}
                className="bg-mh-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition"
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={item.img}
                    alt="Assessment"
                    className="w-full h-[180px] sm:h-[200px] object-cover"
                  />

                  {/* Badge */}
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-mh-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full shadow">
                    Research-Based
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <h3 className="text-sm sm:text-base font-semibold text-mh-dark mb-2">
                    Anxiety Assessment
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    A quick screening that helps identify symptoms of excessive
                    worry, tension, and emotional overwhelm.
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="flex items-center gap-1 text-mh-green font-semibold">
                      ⭐ 4.9
                    </span>
                    <span className="text-gray-500">190 Reviews</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="flex justify-center mt-8 sm:mt-12 lg:mt-14">
            <button className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-mh-gradient text-mh-white text-sm sm:text-base font-semibold hover:opacity-90 transition">
              View All Assessment
            </button>
          </div>

        </div>
      </section>

      {/* Assessments Matter Section  */}


      <section className="bg-mh-light py-12 md:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-mh-dark mb-8 sm:mb-12 lg:mb-16">
            Why These <br className="hidden sm:block" /> Assessments Matter
          </h2>

          {/* Layout */}
          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 items-center">

            {/* LEFT COLUMN */}
            <div className="space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="relative bg-[#D3D9F4] rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[140px] sm:min-h-[160px]">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-mh-white rounded-md mb-4 sm:mb-6"></div>
                <p className="text-sm sm:text-base font-medium">
                  Used by mental health <br className="hidden sm:block" /> professionals
                </p>
              </div>

              <div className="relative bg-[#B4EACF] rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[140px] sm:min-h-[160px]">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-mh-white rounded-md mb-4 sm:mb-6"></div>
                <p className="text-sm sm:text-base font-medium">
                  Backed by standardized <br className="hidden sm:block" /> psychological models
                </p>
              </div>
            </div>

            {/* CENTER IMAGE */}
            <div className="flex justify-center order-first lg:order-none">
              <img
                src={assessmentMatterImage}
                alt="Assessment importance"
                className="rounded-2xl sm:rounded-3xl w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[460px] h-[250px] sm:h-[320px] lg:h-[400px] object-cover"
              />
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="relative bg-[#F9DAEB] rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[140px] sm:min-h-[160px]">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-mh-white rounded-md mb-4 sm:mb-6"></div>
                <p className="text-sm sm:text-base font-medium">
                  Safe, confidential, private
                </p>
              </div>

              <div className="relative bg-[#D4E8EF] rounded-2xl sm:rounded-3xl p-6 sm:p-8 min-h-[140px] sm:min-h-[160px]">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-mh-white rounded-md mb-4 sm:mb-6"></div>
                <p className="text-sm sm:text-base font-medium">
                  Used for preliminary screening, not diagnosis
                </p>
              </div>
            </div>

            {/* Decorative Circles
            <div className="hidden lg:block absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-1/2 w-[500px] h-[500px] border border-gray-200 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute left-1/2 top-1/2 w-[320px] h-[320px] border border-gray-200 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            </div> */}

          </div>
        </div>
      </section>

      {/* Why Choose Soukya */}

    
      <section className="bg-mh-white py-12 md:py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Section Title */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-mh-dark mb-8 sm:mb-12 lg:mb-14">
          Why Choose Soukya Stacks
        </h2>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">

          {/* LEFT IMAGE */}
          <div>
            <img
              src={soukya}
              alt="Why choose Soukya"
              className="rounded-2xl sm:rounded-3xl w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[520px] object-cover"
            />
          </div>

          {/* RIGHT CONTENT */}
          <div className="space-y-4 sm:space-y-6">

            {/* Active Highlight Card */}
            <div className="bg-mh-gradient rounded-xl sm:rounded-2xl p-5 sm:p-6 text-mh-white">
              <h4 className="text-base sm:text-lg font-semibold mb-2">Heading</h4>
              <p className="text-xs sm:text-sm opacity-90">
                It is a long established fact that a reader will be distracted by the
                readable content of a page when looking at its layout. The point of
                using Lorem Ipsum is that it has a more-or-less normal.
              </p>
            </div>

            {/* Accordion Items */}
            {['Heading', 'Heading', 'Heading', 'Heading'].map((item, index) => (
              <div
                key={index}
                className="border-b border-gray-200 py-3 sm:py-4 cursor-pointer hover:text-mh-green transition"
              >
                <h4 className="text-sm sm:text-base font-medium text-mh-dark">
                  {item}
                </h4>
              </div>
            ))}

          </div>
        </div>

      </div>
    </section>

    {/* Testimonials section  */}
   
   
    <section className="bg-mh-light py-12 md:py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 lg:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-mh-dark">
            Testimonials
          </h2>

          <button className="mt-4 sm:mt-0 px-5 sm:px-6 py-2 rounded-full bg-mh-gradient text-mh-white text-xs sm:text-sm font-semibold hover:opacity-90 transition">
            View All Testimonials
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">

          {/* Testimonial Card */}
          {[1, 2].map((_, index) => (
            <div
              key={index}
              className="bg-mh-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm"
            >
              {/* Stars */}
              <div className="flex gap-1 text-mh-green mb-3 sm:mb-4 text-sm sm:text-base">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <span key={i}>★</span>
                  ))}
              </div>

              {/* Content */}
              <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Suspendisse varius enim in eros elementum tristique. Duis
                cursus, mi quis viverra ornare, eros dolor interdum nulla,
                ut commodo diam libero vitae erat."
              </p>

              {/* User */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs sm:text-sm">
                  😊
                </div>

                <div>
                  <p className="text-sm sm:text-base font-semibold text-mh-dark">
                    Name Surname
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Company name
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Controls */}
        <div className="flex justify-between items-center mt-8 sm:mt-10 lg:mt-12">

          {/* Dots */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-1 rounded-full bg-mh-green"></span>
            <span className="w-2 h-1 rounded-full bg-green-200"></span>
            <span className="w-2 h-1 rounded-full bg-green-200"></span>
          </div>

          {/* Arrows */}
          <div className="flex gap-2 sm:gap-3">
            <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 text-mh-green flex items-center justify-center hover:bg-green-200 transition text-sm sm:text-base">
              ‹
            </button>
            <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-mh-green text-mh-white flex items-center justify-center hover:opacity-90 transition text-sm sm:text-base">
              ›
            </button>
          </div>

        </div>

      </div>
    </section>


    {/* FAQ Section  */}
    
    <section className="bg-mh-white py-12 md:py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">

          {/* LEFT CONTENT */}
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-mh-dark mb-3 sm:mb-4">
              Frequently Asked <br className="hidden sm:block" /> Questions
            </h2>

            <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8">
              If you still have questions?
            </p>

            <button className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-mh-gradient text-mh-white text-sm sm:text-base font-semibold hover:opacity-90 transition">
              Contact Us
            </button>
          </div>

          {/* RIGHT FAQ */}
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-xl sm:rounded-2xl border transition ${
                  activeIndex === index
                    ? 'bg-green-50 border-green-100'
                    : 'bg-mh-white border-gray-200'
                }`}
              >
                <button
                  onClick={() =>
                    setActiveIndex(activeIndex === index ? -1 : index)
                  }
                  className="w-full flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 text-left"
                >
                  <span className="text-sm sm:text-base font-bold text-mh-dark pr-4">
                    {faq.question}
                  </span>
                  <span className="text-lg sm:text-xl font-semibold flex-shrink-0">
                    {activeIndex === index ? '−' : '+'}
                  </span>
                </button>

                {activeIndex === index && faq.answer && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-gray-600 text-xs sm:text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>


    </>
  );
}


export default HomePage;