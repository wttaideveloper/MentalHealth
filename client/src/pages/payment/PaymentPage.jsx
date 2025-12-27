import { useState } from 'react';

function PaymentPage() {
  const [selectedPayment, setSelectedPayment] = useState('cards');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [cardNumber, setCardNumber] = useState('1234 5678 5455 4537');
  const [cardHolder, setCardHolder] = useState('Name on card');
  const [expireDate, setExpireDate] = useState('DD/YY');
  const [cvc, setCvc] = useState('DD/YY');

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <span className="cursor-pointer hover:text-gray-700">Home</span> 
          <span className="mx-2">/</span> 
          <span className="cursor-pointer hover:text-gray-700">All Assessments</span> 
          <span className="mx-2">/</span> 
          <span className="cursor-pointer hover:text-gray-700">Anxiety Assessment</span> 
          <span className="mx-2">/</span> 
          <span className="text-[#039059] font-medium">Check out</span>
        </div>

        <h1 className="text-3xl font-bold text-black mb-8">Check Out</h1>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Main Content */}
          <div className="col-span-8">
            {/* Billing Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-6">Billing Information</h2>
              
              {/* Country */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-white text-sm">🇮🇳</span>
                    </div>
                  </div>
                  <select 
                    className="w-full pl-12 pr-4 py-3 border border-[#E5E5E5] rounded-lg bg-white text-gray-500 appearance-none focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="">Select your Country</option>
                    <option value="india">India</option>
                    <option value="usa">United States</option>
                    <option value="uk">United Kingdom</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* State */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-white text-gray-500 appearance-none focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  >
                    <option value="">Select your State</option>
                    <option value="california">California</option>
                    <option value="texas">Texas</option>
                    <option value="new-york">New York</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Payment Option Header */}
              <h2 className="text-xl font-semibold text-black mb-4">Payment Option</h2>
              
              {/* Payment Options and Card Details Side by Side */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left - Payment Options */}
                <div className="col-span-4">
                  {/* UPI Option */}
                  <div className="mb-3">
                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedPayment === 'upi' 
                        ? 'border-[#039059] bg-[#039059] bg-opacity-10 border-2' 
                        : 'border-[#E5E5E5] hover:bg-gray-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        className="w-5 h-5 text-[#039059] mr-3"
                        checked={selectedPayment === 'upi'}
                        onChange={() => setSelectedPayment('upi')}
                      />
                      <span className="text-orange-500 text-xl mr-2">📱</span>
                      <span className="text-gray-700 font-medium">UPI</span>
                    </label>
                  </div>

                  {/* Cards Option */}
                  <div className="mb-3">
                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedPayment === 'cards' 
                        ? 'border-[#039059] bg-[#039059] bg-opacity-10 border-2' 
                        : 'border-[#E5E5E5] hover:bg-gray-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        className="w-5 h-5 text-[#039059] mr-3"
                        checked={selectedPayment === 'cards'}
                        onChange={() => setSelectedPayment('cards')}
                      />
                      <div className="w-6 h-4 bg-black rounded-sm mr-3"></div>
                      <span className="text-gray-700 font-medium">Cards</span>
                    </label>
                  </div>

                  {/* Net Banking Option */}
                  <div className="mb-3">
                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedPayment === 'netbanking' 
                        ? 'border-[#039059] bg-[#039059] bg-opacity-10 border-2' 
                        : 'border-[#E5E5E5] hover:bg-gray-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        className="w-5 h-5 text-[#039059] mr-3"
                        checked={selectedPayment === 'netbanking'}
                        onChange={() => setSelectedPayment('netbanking')}
                      />
                      <div className="w-6 h-4 bg-gray-400 rounded-sm mr-3"></div>
                      <span className="text-gray-700 font-medium">Net Banking</span>
                    </label>
                  </div>
                </div>

                {/* Right - Card Details Form */}
                <div className="col-span-8">
                  <div className="space-y-4">
                    {/* Card Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                          <div className="w-7 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                          <div className="w-7 h-5 bg-red-500 rounded flex items-center justify-center">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          </div>
                          <div className="w-7 h-5 bg-blue-500 rounded"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Holder Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Holder Name</label>
                      <input 
                        type="text" 
                        placeholder="Name on card"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-gray-50 text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
                      />
                    </div>
                    
                    {/* Expire Date and CVC */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expire Date</label>
                        <input 
                          type="text" 
                          placeholder="DD/YY"
                          value={expireDate}
                          onChange={(e) => setExpireDate(e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-gray-50 text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                        <input 
                          type="text" 
                          placeholder="DD/YY"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-gray-50 text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Details */}
          <div className="col-span-4">
            {/* Order Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-black mb-6">Order Details</h3>
              <div className="flex items-start space-x-4 mb-2">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center">
                  <div className="text-2xl">📊</div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Anxiety Assessment</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#039059] font-bold text-lg">$150</span>
                    <span className="text-gray-400 line-through text-sm">$300</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-black mb-6">Order Summary</h3>
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sub-total</span>
                  <span className="text-gray-900 font-medium">$150</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount (50% Off)</span>
                  <span className="text-[#039059] font-medium">-$150</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900 font-medium">$10</span>
                </div>
                <div className="border-t pt-4 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-black">Total</span>
                    <span className="text-black">$160</span>
                  </div>
                </div>
              </div>
              
              {/* Terms */}
              <div className="text-xs text-gray-500 leading-relaxed mb-6">
                By completing your purchase, you agree to these{' '}
                <span className="text-[#039059] underline cursor-pointer font-medium">Terms of Use</span>
              </div>
              
              {/* Purchase Button */}
              <button className="w-full bg-gradient-to-r from-[#01321F] to-[#03985E] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-[#039059] focus:ring-offset-2">
                Purchase
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;