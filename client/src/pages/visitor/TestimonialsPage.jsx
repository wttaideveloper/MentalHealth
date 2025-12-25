function TestimonialsPage() {
  const testimonials = Array(8).fill({
    name: 'Name Surname',
    company: 'Company name',
    text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Suspendisse varius enim in eros elementum tristique.
    Duis cursus, mi quis viverra ornare, eros dolor interdum nulla,
    ut commodo diam libero vitae erat.`,
  });

  return (
    <section className="bg-mh-light py-20">
      <div className="max-w-7xl mx-auto px-6">

        {/* Breadcrumb */}
        <p className="text-sm text-gray-500 mb-4">
          Home / Testimonials
        </p>

        {/* Title */}
        <h1 className="text-3xl lg:text-4xl font-bold text-mh-dark mb-14">
          Testimonials
        </h1>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="bg-mh-white rounded-2xl p-6 shadow-sm"
            >
              {/* Stars */}
              <div className="flex gap-1 text-mh-green mb-4">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <span key={i}>★</span>
                  ))}
              </div>

              {/* Text */}
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {item.text}
              </p>

              {/* User */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  😊
                </div>

                <div>
                  <p className="text-sm font-semibold text-mh-dark">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default TestimonialsPage;
