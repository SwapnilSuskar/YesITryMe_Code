import { Shield, Lock, Eye, RefreshCw, CheckCircle2, Mail, Phone as PhoneIcon, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 mt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 via-white to-red-50 px-8 py-8 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#FF4E00] to-[#E64500] rounded-xl flex items-center justify-center shadow">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    YesITryMe Privacy Policy
                  </h1>
                  <p className="text-sm text-gray-600">
                    Transparent information on how we collect, use, and safeguard your data.
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <Link
                  to="/terms-and-conditions"
                  className="px-4 py-2 rounded-lg bg-[#FF4E00] hover:bg-[#E64500] text-white text-sm font-semibold shadow"
                >
                  View Terms
                </Link>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-[#FF4E00] text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Scope & Overview</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                This Privacy Policy explains how YesITryMe (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects,
                uses, discloses, and protects information when you use our website, training content, and Social
                Earning features. By accessing our services, you consent to the practices described here.
              </p>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-[#FF4E00] text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Information We Collect</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-[#FF4E00] mb-2">Account & Profile</h3>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Name, email, phone, referral details</li>
                    <li>• KYC documents (when required)</li>
                    <li>• Purchase and subscription history</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-[#FF4E00] mb-2">Platform Activity</h3>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Course progress and assessments</li>
                    <li>• Social earning tasks, watch timers, rewards</li>
                    <li>• Wallet balance, withdrawals, and transactions</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-green-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  3
                </div>
                <h2 className="text-2xl font-bold text-gray-800">YouTube API & OAuth Data</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                When you connect your YouTube account, we request the scopes{" "}
                <code className="bg-white px-2 py-1 rounded-md text-sm">youtube.readonly</code> and{" "}
                <code className="bg-white px-2 py-1 rounded-md text-sm">youtube.force-ssl</code> to verify task activity.
                We only read public channel details, video identifiers, and engagement state (view/like/comment/subscribe)
                to validate rewards. We do not store your Google password and you may revoke access at any time from your
                Google security console or by disconnecting inside YesITryMe.
              </p>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">How we use this data</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Confirm that assigned YouTube actions were completed</li>
                    <li>• Prevent fraud and duplicate rewards</li>
                    <li>• Maintain audit logs for Trust & Safety</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Your controls</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Disconnect from dashboard at any time</li>
                    <li>• Delete social-earning history upon request</li>
                    <li>• Contact support for data export or removal</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Our use of Google data complies with the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 font-semibold underline"
                >
                  Google API Services User Data Policy
                </a>{" "}
                and Limited Use requirements.
              </p>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-[#FF4E00] text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  4
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Data Sharing & Retention</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                We never sell personal data. Limited information may be shared with trusted processors (cloud hosting,
                payment gateways, analytics) solely to deliver the service. All third parties are bound by confidentiality.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Financial data is retained for as long as required by law.</li>
                <li>• Social earning logs are purged when they are no longer needed for fraud prevention.</li>
                <li>• You may request deletion of your account by contacting support.</li>
              </ul>
            </section>

            <section className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-purple-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  5
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Security & Your Rights</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-purple-200 flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Security Practices</h4>
                    <p className="text-gray-700 text-sm">
                      Tokens are encrypted at rest, TLS protects all traffic, and access is restricted to vetted personnel only.
                    </p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-purple-200 flex items-start space-x-3">
                  <Eye className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Your Choices</h4>
                    <p className="text-gray-700 text-sm">
                      Access, update, or delete your information, withdraw consent, and opt out of marketing emails at any time.
                    </p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-purple-200 flex items-start space-x-3">
                  <RefreshCw className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Data Portability</h4>
                    <p className="text-gray-700 text-sm">
                      Request a copy of your stored data in a machine-readable format by emailing our support team.
                    </p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-purple-200 flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Regulatory Compliance</h4>
                    <p className="text-gray-700 text-sm">
                      We comply with Indian IT Act guidelines and international best practices for user consent and disclosure.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-yellow-500 text-white font-bold rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  6
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Contact & Updates</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Privacy Policy to reflect new features or legal requirements. When we do, we will revise
                the &quot;Last Updated&quot; date and notify active users via email or dashboard banners.
              </p>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-200 grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#FF4E00] rounded-full flex items-center justify-center mx-auto mb-2 shadow">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-800">Email</p>
                  <p className="text-[#FF4E00] text-sm break-all">YesITryMeofficial@gmail.com</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#FF4E00] rounded-full flex items-center justify-center mx-auto mb-2 shadow">
                    <PhoneIcon className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-800">Phone</p>
                  <p className="text-[#FF4E00] text-sm">+91 77569 16324</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#FF4E00] rounded-full flex items-center justify-center mx-auto mb-2 shadow">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-800">Address</p>
                  <p className="text-[#FF4E00] text-sm">
                    395, Mahadev Nagar, Behind Devakate Hospital, Arvi, Maharashtra, India 413249
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center">
              <p className="text-gray-700 text-sm">
                Need more details about how we handle your data? Review our{" "}
                <Link to="/terms-and-conditions" className="text-orange-600 font-semibold underline">
                  Terms & Conditions
                </Link>{" "}
                or contact our Trust & Safety team anytime.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

