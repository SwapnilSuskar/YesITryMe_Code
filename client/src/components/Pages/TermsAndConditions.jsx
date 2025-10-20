import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, XCircle, CreditCard, Mail, Phone as PhoneIcon, MapPin } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 mt-12">
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Content Header */}
          <div className="bg-gradient-to-r from-orange-50 via-white to-red-50 px-8 py-8 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#FF4E00] to-[#E64500] rounded-xl flex items-center justify-center shadow">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">YesITryMe Legal Agreement</h2>
                  <p className="text-sm text-gray-600">Please read these terms carefully before using the platform</p>
                </div>
              </div>
              <div className="hidden md:block">
                <Link to="/signup" className="px-4 py-2 rounded-lg bg-[#FF4E00] hover:bg-[#E64500] text-white text-sm font-semibold shadow">
                  Create Account
                </Link>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Introduction */}
            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-[#FF4E00] text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Introduction</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to <span className="font-semibold text-[#FF4E00]">YesITryMe</span> ("we," "our," or "us"). These Terms and Conditions govern your use of our learning platform and services. By accessing or using our website, you agree to be bound by these terms.
              </p>
              <p className="text-gray-700 leading-relaxed">
                YesITryMe provides online educational courses, training materials, and learning resources. By using our services, you acknowledge that you have read, understood, and agree to be bound by these terms.
              </p>
            </section>

            {/* Definitions */}
            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-[#FF4E00] text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Definitions</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-[#FF4E00] mb-2">"Service"</h3>
                  <p className="text-gray-700 text-sm">Refers to the YesITryMe website and learning platform.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-[#FF4E00] mb-2">"User," "you," and "your"</h3>
                  <p className="text-gray-700 text-sm">Refers to you, as the user of the Service.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-[#FF4E00] mb-2">"Content"</h3>
                  <p className="text-gray-700 text-sm">Refers to text, images, videos, and other materials available on our platform.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-[#FF4E00] mb-2">"Course"</h3>
                  <p className="text-gray-700 text-sm">Refers to any educational program or training material offered through our platform.</p>
                </div>
              </div>
            </section>

            {/* Account Registration */}
            <section className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-green-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  3
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Account Registration</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                To access certain features of our Service, you must create an account. You agree to:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="text-green-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">Provide accurate, current, and complete information during registration</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="text-green-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">Maintain and promptly update your account information</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="text-green-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">Keep your password secure and confidential</span>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="text-green-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">Accept responsibility for all activities under your account</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✓</span>
                    <span className="text-gray-700">Notify us immediately of any unauthorized use of your account</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Use of Service */}
            <section className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-2xl border border-red-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-red-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  4
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Use of Service</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may use our Service for lawful purposes only. You agree not to:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <XCircle className="text-red-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">Use the Service for any illegal or unauthorized purpose</span>
                  </li>
                  <li className="flex items-start">
                    <XCircle className="text-red-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">Share your account credentials with others</span>
                  </li>
                  <li className="flex items-start">
                    <XCircle className="text-red-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">Attempt to gain unauthorized access to our systems</span>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <XCircle className="text-red-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">Interfere with or disrupt the Service</span>
                  </li>
                  <li className="flex items-start">
                    <XCircle className="text-red-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">Copy, modify, or distribute our content without permission</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2 mt-1">✗</span>
                    <span className="text-gray-700">Use automated systems to access the Service</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Payment Terms */}
            <section className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-2xl border border-purple-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-purple-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  5
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Payment and Subscription</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Some courses and features require payment. By purchasing a subscription or course:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CreditCard className="text-purple-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">You agree to pay all fees associated with your purchase</span>
                  </li>
                  <li className="flex items-start">
                    <CreditCard className="text-purple-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">All payments are non-refundable unless otherwise stated</span>
                  </li>
                  <li className="flex items-start">
                    <CreditCard className="text-purple-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">Prices may change with 30 days notice</span>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CreditCard className="text-purple-600 mr-2 mt-0.5 w-4 h-4" />
                    <span className="text-gray-700">Subscriptions automatically renew unless cancelled</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2 mt-1">💳</span>
                    <span className="text-gray-700">You are responsible for all applicable taxes</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Nominee Agreement and Commission Policy */}
            <section className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-[#FF4E00] text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  6
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Nominee Agreement and Commission Policy</h2>
              </div>
              <div className="bg-white p-4 rounded-lg border border-orange-200 space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  I, the user, may designate my business nominee from my blood relation and I agree to all
                  rules, regulations, and the Terms & Conditions of <span className="font-semibold text-[#FF4E00]">YesITryMe</span>.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  YesITryMe is an online digital earning platform operating on a refer-and-earn model. Commissions are
                  provided based on the business generated by users and active partners. These commissions are not a salary
                  and there is no fixed income. Earnings depend on overall business performance; turnover depends on the
                  user account and the applicable business plan structure.
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Designation of a nominee is optional but recommended for account security.</li>
                  <li>Commissions are variable and directly linked to business activity and plan rules.</li>
                  <li>YesITryMe does not guarantee any fixed or minimum income.</li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-yellow-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  7
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Intellectual Property</h2>
              </div>
              <div className="bg-white p-4 rounded-lg border border-yellow-200">
                <p className="text-gray-700 leading-relaxed mb-4">
                  The Service and its original content, features, and functionality are owned by YesITryMe and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Service without our prior written consent.
                </p>
              </div>
            </section>

            {/* Privacy */}
            <section className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  8
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Privacy Policy</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding the collection and use of your personal information.
              </p>
            </section>

            {/* YouTube API and Data Usage */}
            <section className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-2xl border border-red-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-red-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  9
                </div>
                <h2 className="text-2xl font-bold text-gray-800">YouTube API and Data Usage</h2>
              </div>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  YesITryMe uses the YouTube API Services to provide task-based earning opportunities. By using our platform, you acknowledge and agree to the following:
                </p>

                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-gray-800 mb-3">YouTube API Services Agreement</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    Our use of information received from Google APIs will adhere to the
                    <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline ml-1">
                      Google API Services User Data Policy
                    </a>, including the Limited Use requirements.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">Data We Collect</h4>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• YouTube channel information (public data only)</li>
                      <li>• Task completion status and progress</li>
                      <li>• User engagement metrics for task verification</li>
                      <li>• Account linking for reward distribution</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">How We Use Data</h4>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• Verify task completion and engagement</li>
                      <li>• Calculate and distribute rewards</li>
                      <li>• Provide personalized task recommendations</li>
                      <li>• Improve platform functionality</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Important Notes</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• We do not store your YouTube login credentials</li>
                    <li>• We only access public YouTube data and your task-related activities</li>
                    <li>• You can revoke access to your YouTube data at any time</li>
                    <li>• We comply with YouTube's Terms of Service and Community Guidelines</li>
                    <li>• All data usage is limited to providing our task-based earning services</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Your Rights</h4>
                  <p className="text-gray-700 text-sm">
                    You have the right to access, modify, or delete your data. You can also revoke our access to your YouTube data through your Google Account settings.
                    For any data-related requests, contact us at <a href="mailto:YesITryMeofficial@gmail.com" className="text-blue-600 hover:underline">YesITryMeofficial@gmail.com</a>.
                  </p>
                </div>
              </div>
            </section>

            {/* Disclaimers */}
            <section className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-gray-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  10
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Disclaimers</h2>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800 font-semibold mb-2">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                </p>
                <p className="text-gray-700">
                  We do not guarantee that the Service will be uninterrupted, secure, or error-free. We reserve the right to modify or discontinue the Service at any time.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-2xl border border-red-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-red-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  11
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Limitation of Liability</h2>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800 font-semibold">
                  IN NO EVENT SHALL YesITryMe BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-orange-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  12
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Termination</h2>
              </div>
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  If you wish to terminate your account, you may simply discontinue using the Service.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-2xl border border-teal-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-teal-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  13
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Changes to Terms</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            {/* Contact Information */}
            <section className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  14
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Contact Information</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-200">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#FF4E00] rounded-full flex items-center justify-center mx-auto mb-2 shadow">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-gray-800">Email</p>
                    <p className="text-[#FF4E00]">YesITryMeofficial@gmail.com</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#FF4E00] rounded-full flex items-center justify-center mx-auto mb-2 shadow">
                      <PhoneIcon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-gray-800">Phone</p>
                    <p className="text-[#FF4E00]">+91 77569 16324</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#FF4E00] rounded-full flex items-center justify-center mx-auto mb-2 shadow">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-gray-800">Address</p>
                    <p className="text-[#FF4E00] text-sm">395,MAHADEV NAGAR, BEHIND DEVAKATE HOSPITAL ARVI,AT PO ARVI TAL SHIRUR KASAR DIST BEED PINCODE-413249, INDIA</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Back Button */}
            <div className="pt-8 border-t border-gray-200">
              <Link
                to="/signup"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#FF4E00] hover:bg-[#E64500] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="mr-2">←</span>
                Back to Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions; 