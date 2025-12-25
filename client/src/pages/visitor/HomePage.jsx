import heroImage from '../../assets/images/hero-home.png';

function HomePage() {
  return (
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
  );
}

export default HomePage;
