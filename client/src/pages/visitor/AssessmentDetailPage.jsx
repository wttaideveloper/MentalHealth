import { useState } from 'react';
import f1 from '../../assets/images/f1.png';
import f2 from '../../assets/images/f2.png';

function AssessmentDetailPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeFaq, setActiveFaq] = useState(0);

  const faqs = [
    {
      q: 'Question text goes here',
      a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.',
    },
    { q: 'Question text goes here', a: '' },
    { q: 'Question text goes here', a: '' },
    { q: 'Question text goes here', a: '' },
  ];

  return (
    <section className="bg-mh-light">
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Breadcrumb */}
        <p className="text-sm text-gray-500 mb-6">
          Home / All Assessments / Anxiety Assessment
        </p>

        {/* TOP SECTION */}
        <div className="bg-[#E1E7F4] rounded-3xl p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
          
          {/* Image */}
          <img
            src={f2}
            alt="Assessment"
            className="rounded-2xl w-full h-[300px] object-cover"
          />

          {/* Info */}
          <div>
            <h1 className="text-2xl font-bold mb-3">
              Anxiety Assessment
            </h1>

            <p className="text-gray-600 mb-6">
              A quick screening that helps identify symptoms of excessive worry,
              tension, and emotional overwhelm.
            </p>

            <div className="flex items-center gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-semibold">
                  $150 <span className="line-through text-gray-400 ml-2">$300</span>
                </p>
                <p className="text-xs text-gray-400">(inclusive of all taxes)</p>
              </div>

              <button className="px-8 py-2 rounded-full bg-mh-green text-mh-white font-semibold">
                Buy Now
              </button>
            </div>

            {/* Meta */}
            <div className="flex gap-6 bg-mh-white rounded-xl p-4 w-fit">
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">10–12 minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Questions</p>
                <p className="font-medium">20 Questions</p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* LEFT SIDEBAR */}
          <div className="space-y-6">
            <h3 className="font-semibold">Featured Assessments</h3>

            {[f1, f2].map((img, i) => (
              <div key={i} className="bg-mh-white rounded-xl p-4 flex gap-4">
                <img src={img} alt="" className="w-20 h-20 rounded-lg object-cover" />
                <div>
                  <p className="font-medium text-sm mb-1">
                    Anxiety Assessment
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    A quick screening that helps identify symptoms...
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">$150</span>
                    <button className="px-4 py-1 text-xs rounded-full bg-mh-green text-mh-white">
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT CONTENT */}
          <div className="lg:col-span-2">

            {/* Tabs */}
            <div className="flex gap-8 border-b mb-8">
              {['overview', 'faqs', 'reviews'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 font-medium ${
                    activeTab === tab
                      ? 'border-b-2 border-mh-green text-mh-green'
                      : 'text-gray-500'
                  }`}
                >
                  {tab === 'overview' && 'Overview'}
                  {tab === 'faqs' && 'FAQs'}
                  {tab === 'reviews' && 'Reviews'}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="font-semibold mb-3">About Assessment</h3>
                <p className="text-gray-600 mb-6">
                  A quick screening that helps identify symptoms of excessive worry,
                  tension, and emotional overwhelm.
                </p>
              </div>
            )}

            {/* FAQ */}
            {activeTab === 'faqs' && (
              <div className="space-y-4">
                {faqs.map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border ${
                      activeFaq === i ? 'bg-green-50' : 'bg-mh-white'
                    }`}
                  >
                    <button
                      className="w-full px-6 py-4 flex justify-between"
                      onClick={() => setActiveFaq(activeFaq === i ? -1 : i)}
                    >
                      <span>{item.q}</span>
                      <span>{activeFaq === i ? '−' : '+'}</span>
                    </button>
                    {activeFaq === i && item.a && (
                      <p className="px-6 pb-4 text-sm text-gray-600">
                        {item.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-mh-green">4.9</span>
                  <span className="text-sm text-gray-500">190 Reviews</span>
                </div>

                {[1, 2].map(i => (
                  <div key={i} className="bg-mh-white rounded-xl p-6">
                    <p className="font-semibold mb-1">Name Surname</p>
                    <p className="text-xs text-gray-500 mb-2">Company name</p>
                    <p className="text-sm text-gray-600">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="border-t bg-mh-white py-4 sticky bottom-0">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <span className="font-semibold">
            Anxiety Assessment — $150
          </span>
          <button className="px-8 py-2 rounded-full bg-mh-green text-mh-white font-semibold">
            Buy Now
          </button>
        </div>
      </div>

    </section>
  );
}

export default AssessmentDetailPage;
