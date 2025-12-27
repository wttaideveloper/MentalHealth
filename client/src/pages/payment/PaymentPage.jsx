import { useState } from 'react';
import anxietyAssessment from '../../assets/images/f2.png';
import upiIcon from '../../assets/images/upi-2.svg';
import cardsIcon from '../../assets/images/cards-2.svg';
import netBankingIcon from '../../assets/images/net-banking-2.svg';
import visaIcon from '../../assets/images/visa.svg';
import cardIcon from '../../assets/images/cardIcon.svg';
import Breadcrumb from '../../components/Breadcrumb';


function PaymentPage() {
  const [selectedPayment, setSelectedPayment] = useState('cards');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [cardNumber, setCardNumber] = useState('1234 5678 5455 4537');
  const [cardHolder, setCardHolder] = useState('Name on card');
  const [expireDate, setExpireDate] = useState('DD/YY');
  const [cvc, setCvc] = useState('DD/YY');

  return (
    <div className="min-h-screen bg-mh-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Breadcrumb */}
        <Breadcrumb isLoggedIn={true} />

        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 sm:mb-8">Check Out</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8">
            {/* Billing Information */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-black mb-4 sm:mb-6">Billing Information</h2>
              
              {/* Country and State on same line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                      <svg className="w-5 h-5 text-mh-green" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <select 
                      className="w-full pl-10 pr-4 py-3 border border-[#E5E5E5] rounded-lg bg-mh-light text-gray-500 appearance-none focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <select 
                      className="w-full pl-10 pr-4 py-3 border border-[#E5E5E5] rounded-lg bg-mh-light text-gray-500 appearance-none focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
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
              </div>

              {/* Payment Option Header */}
              <h2 className="text-lg sm:text-xl font-semibold text-black mb-4">Payment Option</h2>
              
              {/* Payment Options and Card Details Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                {/* Left - Payment Options */}
                <div className="lg:col-span-4">
                  {/* UPI Option */}
                  <div className="mb-3">
                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedPayment === 'upi' 
                        ? 'border-mh-green bg-[#038A561A] bg-opacity-10 border-2' 
                        : 'border-[#E5E5E5] hover:bg-gray-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        className="w-5 h-5 mr-3"
                        style={{ accentColor: '#039059' }}
                        checked={selectedPayment === 'upi'}
                        onChange={() => setSelectedPayment('upi')}
                      />
                      <img src={upiIcon} alt="UPI" className="w-6 h-6 mr-2" />
                      <span className="text-gray-700 font-medium">UPI</span>
                    </label>
                  </div>

                  {/* Cards Option */}
                  <div className="mb-3">
                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedPayment === 'cards' 
                        ? 'border-mh-green bg-[#038A561A] bg-opacity-10 border-2' 
                        : 'border-[#E5E5E5] hover:bg-gray-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        className="w-5 h-5 mr-3"
                        style={{ accentColor: '#039059' }}
                        checked={selectedPayment === 'cards'}
                        onChange={() => setSelectedPayment('cards')}
                      />
                      <img src={cardsIcon} alt="Cards" className="w-6 h-6 mr-2" />
                      <span className="text-gray-700 font-medium">Cards</span>
                    </label>
                  </div>

                  {/* Net Banking Option */}
                  <div className="mb-3">
                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedPayment === 'netbanking' 
                        ? 'border-mh-green bg-[#038A561A] bg-opacity-10 border-2' 
                        : 'border-[#E5E5E5] hover:bg-gray-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        className="w-5 h-5 mr-3"
                        style={{ accentColor: '#039059' }}
                        checked={selectedPayment === 'netbanking'}
                        onChange={() => setSelectedPayment('netbanking')}
                      />
                      <img src={netBankingIcon} alt="Net Banking" className="w-6 h-6 mr-2" />
                      <span className="text-gray-700 font-medium">Net Banking</span>
                    </label>
                  </div>
                </div>

                {/* Right - Card Details Form */}
                <div className="lg:col-span-8">
                  <div className="space-y-4">
                    {/* Card Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-mh-light text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                         <img src={cardIcon} alt="Visa" className="w-6 h-6 mr-2" />
                        </div>
                        
                      </div>
                      <div className='flex justify-end space-x-2'>
                          <img src={visaIcon} alt="Visa" className="w-28 h-10 mr-2" />
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
                        className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-mh-light text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
                      />
                    </div>
                    
                    {/* Expire Date and CVC */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expire Date</label>
                        <input 
                          type="text" 
                          placeholder="DD/YY"
                          value={expireDate}
                          onChange={(e) => setExpireDate(e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-mh-light text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                        <input 
                          type="text" 
                          placeholder="DD/YY"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value)}
                          className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg bg-mh-light text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#039059] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Details */}
          <div className="lg:col-span-4 order-first lg:order-last">
            {/* Order Details */}
            <div className="bg-mh-light shadow-sm p-4 sm:p-6 border-b">
              <h3 className="text-lg font-semibold text-black mb-4 sm:mb-6">Order Details</h3>
              <div className="flex items-start space-x-3 sm:space-x-4 mb-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img src={anxietyAssessment} alt="Anxiety Assessment" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Anxiety Assessment</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#039059] font-bold text-base sm:text-lg">$150</span>
                    <span className="text-gray-400 line-through text-xs sm:text-sm">$300</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-mh-light shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-black mb-4 sm:mb-6">Order Summary</h3>
              <div className="space-y-3 sm:space-y-4 text-sm mb-4 sm:mb-6">
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
                <div className="border-t pt-3 sm:pt-4 mt-2">
                  <div className="flex justify-between font-bold text-base sm:text-lg">
                    <span className="text-black">Total</span>
                    <span className="text-black">$160</span>
                  </div>
                </div>
              </div>
              
              {/* Terms */}
              <div className="text-xs text-gray-500 leading-relaxed mb-4 sm:mb-6">
                By completing your purchase, you agree to these{' '}
                <span className="text-[#039059] underline cursor-pointer font-medium">Terms of Use</span>
              </div>
              
              {/* Purchase Button */}
              <button className="w-full bg-mh-gradient text-white py-3 rounded-full font-semibold hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-[#039059] focus:ring-offset-2">
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