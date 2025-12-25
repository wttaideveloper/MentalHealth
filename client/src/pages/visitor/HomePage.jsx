import heroImage from '../../assets/images/hero-home.png';

function HomePage() {
  return (
    <>
      <section className="bg-mh-light py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* LEFT CONTENT */}
            <div>
              {/* Pills */}
              <div className="flex gap-3 mb-6">
                <span className="px-4 py-1 rounded-full text-sm bg-[#FBEBDC] ">
                  Reassurance
                </span>
                <span className="px-4 py-1 rounded-full text-sm  bg-[#D5DCEE]">
                  Privacy
                </span>
                <span className="px-4 py-1 rounded-full text-sm  bg-[#DFF7EA]">
                  Confidentiality
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl lg:text-5xl font-medium leading-tight text-mh-dark mb-6">
                Understand Your <br />
                <span className="inline-block bg-[#C5E9DB] px-3 py-1 rounded-xl">
                  Mental Health
                </span>
                <br />
                with Science-Backed <br />
                Assessments
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-lg mb-8">
                Take clinically aligned mental health assessments and receive a clear,
                private report you can confidently share with a professional.
              </p>

              {/* Button */}
              <button className="px-8 py-3 rounded-full bg-mh-gradient text-mh-white font-semibold hover:opacity-90 transition">
                Explore Assessments
              </button>
            </div>


            {/* RIGHT IMAGE CARD */}
            <div className="relative flex justify-center">

              {/* Image container */}
              <div className="relative rounded-[32px] overflow-hidden ">
                <img
                  src={heroImage}
                  alt="Mental health wellbeing"
                  className="w-[600px] h-[520px] object-cover"
                />
              </div>



            </div>
          </div>
        </div>
      </section>
  
      {/* Featured Assessments Section */}

      <section className="bg-mh-light py-24">
        <div className="max-w-7xl mx-auto px-6">

          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-mh-dark mb-4">
              Featured Assessments
            </h2>
            <p className="text-gray-600  mx-auto">
              Take clinically aligned mental health assessments and receive a clear, <br></br>
              private report you can confidently share with a professional.
            </p>
          </div>

          {/* Cards */}
          <div className="space-y-10">

            {/* Card 1 */}
            <div className="bg-[#FBEBDC] rounded-3xl p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

              {/* Left */}
              <div>
                <h3 className="text-2xl font-semibold mb-3">
                  Anxiety Assessment
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  A quick screening that helps identify symptoms of excessive worry,
                  tension, and emotional overwhelm.
                </p>

                <div className="flex gap-10 mb-6">
                  <div>
                    <p className="text-sm text-mh-dark font-bold">Duration</p>
                    <p className="font-medium text-gray-700">10–12 minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-mh-dark font-bold">Questions</p>
                    <p className="font-medium text-gray-700">20 questions</p>
                  </div>
                </div>

                <button className="px-6 py-2 rounded-full bg-mh-green text-mh-white text-sm font-semibold">
                  View Details
                </button>
              </div>

              {/* Right */}
              <div className="relative">
                <span className="absolute top-4 left-4 bg-mh-white text-xs px-3 py-1 rounded-full shadow">
                  Research-Based
                </span>
                <img
                  src="/images/anxiety.jpg"
                  alt="Anxiety assessment"
                  className="rounded-2xl w-full h-[260px] object-cover"
                />
              </div>

            </div>

            {/* Card 2 */}
            <div className="bg-[#D5DCEE] rounded-3xl p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

              <div>
                <h3 className="text-2xl font-semibold mb-3">
                  Depression Screening
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Evaluates mood patterns, motivation levels, and emotional well-being
                  to detect signs of low mood or persistent sadness.
                </p>

                <div className="flex gap-10 mb-6">
                  <div>
                    <p className="text-sm text-mh-dark font-bold">Duration</p>
                    <p className="font-medium text-gray-700">10–12 minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-mh-dark font-bold">Questions</p>
                    <p className="font-medium text-gray-700">20 questions</p>
                  </div>
                </div>

                <button className="px-6 py-2 rounded-full bg-mh-green text-mh-white text-sm font-semibold">
                  View Details
                </button>
              </div>

              <div className="relative">
                <span className="absolute top-4 left-4 bg-mh-white text-xs px-3 py-1 rounded-full shadow">
                  Research-Based
                </span>
                <img
                  src="/images/depression.jpg"
                  alt="Depression screening"
                  className="rounded-2xl w-full h-[260px] object-cover"
                />
              </div>

            </div>

            {/* Card 3 */}
            <div className="bg-[#F7E3EE] rounded-3xl p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

              <div>
                <h3 className="text-2xl font-semibold mb-3">
                  ADHD / Attention Difficulty Screening
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Assesses focus, impulsivity, and attention-related challenges
                  to support early understanding of ADHD-like symptoms.
                </p>

                <div className="flex gap-10 mb-6">
                  <div>
                    <p className="text-sm text-mh-dark font-bold">Duration</p>
                    <p className="font-medium text-gray-700">10–12 minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-mh-dark font-bold">Questions</p>
                    <p className="font-medium text-gray-700">20 questions</p>
                  </div>
                </div>

                <button className="px-6 py-2 rounded-full bg-mh-green text-mh-white text-sm font-semibold">
                  View Details
                </button>
              </div>

              <div className="relative">
                <span className="absolute top-4 left-4 bg-mh-white text-xs px-3 py-1 rounded-full shadow">
                  Research-Based
                </span>
                <img
                  src="/images/adhd.jpg"
                  alt="ADHD screening"
                  className="rounded-2xl w-full h-[260px] object-cover"
                />
              </div>

            </div>

          </div>
        </div>
      </section>
    </>
  );
}


export default HomePage;
