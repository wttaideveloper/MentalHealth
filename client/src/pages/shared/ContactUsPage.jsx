import { useLocation } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';

function ContactUsPage() {
  const location = useLocation();
  const isLoggedIn = location.pathname.startsWith('/user');
  
  return (
    <section className="bg-mh-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb */}
        <Breadcrumb isLoggedIn={isLoggedIn} />

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* LEFT CONTENT */}
          <div>
            <h1 className="text-3xl lg:text-4xl font-medium text-mh-dark mb-4">
              Reach Out Anytime
            </h1>

            <p className="text-gray-600 max-w-md mb-10">
              Whether you’re exploring a new assessment or need help
              understanding your report, we’re here to assist you
              with care and clarity.
            </p>

            {/* Info Cards */}
            <div className="flex flex-col sm:flex-row gap-6">

              {/* Email */}
              <div className="bg-mh-light rounded-2xl p-6 flex items-start gap-4 shadow-sm w-full sm:w-64">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-mh-green">
                  ✉
                </div>
                <div>
                  <p className="font-medium mb-1">General Enquiries</p>
                  <p className="text-sm text-gray-500">
                    info@soukya.com
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-mh-light rounded-2xl p-6 flex items-start gap-4 shadow-sm w-full sm:w-64">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-mh-green">
                  ☎
                </div>
                <div>
                  <p className="font-medium mb-1">Phone</p>
                  <p className="text-sm text-gray-500">
                    +1 536 836 8848
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="bg-mh-white rounded-3xl p-8 shadow-sm">

            <form className="space-y-6">

              {/* Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your first name"
                    className="bg-mh-light border border-gray-200 rounded-xl px-4 py-3.5 text-sm w-full outline-none focus:border-mh-green transition-colors placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your last name"
                    className="bg-mh-light border border-gray-200 rounded-xl px-4 py-3.5 text-sm w-full outline-none focus:border-mh-green transition-colors placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Email & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your Email"
                    className="bg-mh-light border border-gray-200 rounded-xl px-4 py-3.5 text-sm w-full outline-none focus:border-mh-green transition-colors placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1  Enter your mobile number"
                    className="bg-mh-light border border-gray-200 rounded-xl px-4 py-3.5 text-sm w-full outline-none focus:border-mh-green transition-colors placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Message
                </label>
                <textarea
                  rows="4"
                  placeholder="Enter your message"
                  className="bg-mh-light border border-gray-200 rounded-xl px-4 py-3.5 text-sm w-full outline-none focus:border-mh-green transition-colors placeholder-gray-400 resize-none"
                ></textarea>
              </div>

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  className="px-10 py-3 rounded-full bg-mh-green text-mh-white font-semibold hover:opacity-90 transition"
                >
                  Send
                </button>
              </div>

            </form>

          </div>

        </div>
      </div>
    </section>
  );
}

export default ContactUsPage;
