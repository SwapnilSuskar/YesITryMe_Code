import { ChevronDown, Globe, HelpCircle, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    q: 'What is YesITryMe?',
    a: `YesITryMe is a digital platform focused on affiliate and network marketing education. It helps individuals learn practical digital skills, build networks, and earn income by promoting our training programs and tools. Our model is based on “First Learn, Implement, Refer & Then Earn.”`,
  },
  {
    q: 'What is Affiliate Marketing?',
    a: `Affiliate marketing is a business model where you earn a commission by promoting someone else’s products or services. At YesITryMe, you promote our training and business tools and earn rewards for every successful referral.`,
  },
  {
    q: 'Who can join YesITryMe?',
    a: `Anyone above the age of 18 can join YesITryMe—whether you're a student, job seeker, professional, homemaker, or entrepreneur. No prior experience is required. All you need is a smartphone, internet connection, and willingness to learn and grow.`,
  },
  {
    q: 'How do I earn with YesITryMe?',
    a: `You earn through:\n\n- Direct referrals of training packages\n- Team commissions from your network growth\n- Performance-based bonuses and ranks\n- Leadership and mentoring rewards (if applicable)`
  },
  {
    q: 'What kind of training do I get?',
    a: `We provide step-by-step training on:\n\n- Affiliate & network marketing strategies\n- Social Media Optimization (SMO)\n- Facebook & Instagram Mastery\n- YouTube Marketing\n- Lead Generation & Funnels\n- Relationship building & personal branding`,
  },
  {
    q: 'Is YesITryMe a legal business?',
    a: `Yes. YesITryMe operates as a legally registered business in India and follows standard affiliate and business guidelines. All transactions, commissions, and payouts are recorded and can be tracked from your dashboard.`,
  },
  {
    q: 'How can I join YesITryMe?',
    a: `You can register through our official website or through a referral link from an existing member. After registration, you’ll get access to our dashboard, training content, and referral tools.`,
  },
  {
    q: 'Do I need to invest money to start?',
    a: `Yes, to access our training and platform features, you need to purchase a starter course or business kit. This is a one-time investment and gives you lifetime access to content and earning potential.`,
  },
  {
    q: 'When and how will I get paid?',
    a: `Payouts are processed as per the company’s payout schedule (for example, weekly or monthly) and according to your plan and commission structure. Once your earnings cross the minimum payout threshold and are verified, payments are transferred to your registered bank account or UPI ID.`,
  },
  {
    q: 'Can I work from home?',
    a: `Absolutely! YesITryMe is a 100% digital business, so you can work from home, a café, or while traveling—anytime, anywhere.`,
  },
  {
    q: 'Is support available if I have doubts or technical issues?',
    a: `Yes. We offer:\n\n- Customer support via email or contact form\n- Guidance and mentorship from your upline/team leader\n- Live or recorded training sessions and webinars (as per schedule)\n- FAQs and training videos on the platform`,
  },
  {
    q: 'Can I grow a team under me?',
    a: `Yes! YesITryMe encourages team-building. You can refer others and help them succeed, which in turn increases your rank, rewards, and passive income.`,
  },
  {
    q: 'Is there any income guarantee?',
    a: `No, income is not guaranteed. Your earnings depend entirely on your personal effort, skills, consistency, and how effectively you use the training. YesITryMe is a legitimate opportunity, not a get-rich-quick scheme or investment plan.`,
  },
  {
    q: 'How can I contact YesITryMe for support?',
    a: `You can reach us via:\n\n- Email: YesITryMeofficial@gmail.com\n- Website: www.YesITryMe.com\n- Customer care: +91-7066916324`
  },
];

const FAQ = () => {
  const [open, setOpen] = useState(0);
  return (
    <section className="relative py-20 px-2 sm:px-0 bg-gradient-to-br from-orange-50 via-white to-orange-100 overflow-hidden">
      {/* Orange blob accent */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-orange-200 via-orange-400 to-orange-100 rounded-full opacity-30 blur-3xl z-0"></div>
      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="flex flex-col items-center mb-12">
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-full p-5 shadow-lg mb-4">
            <HelpCircle className="w-14 h-14 text-white drop-shadow" />
          </div>
          <h2 className="text-5xl font-extrabold text-orange-600 mb-2 text-center drop-shadow-lg tracking-tight font-sans">YesITryMe Affiliate Marketing – FAQ</h2>
          <p className="text-xl text-gray-600 text-center max-w-2xl mb-4 font-sans">Find answers to the most common questions about YesITryMe, affiliate marketing, earning, support, and more.</p>
        </div>
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Questions List */}
          <div className="flex-1 space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`transition-all duration-300 rounded-2xl shadow-xl border border-orange-100 bg-white/90 backdrop-blur-xl overflow-hidden 
                  ${open === idx ? 'ring-2 ring-orange-400 scale-[1.02] border-l-8 border-orange-500' : 'hover:scale-[1.01]'}
                `}
              >
                <button
                  className={`w-full flex justify-between items-center px-6 py-6 text-left text-lg sm:text-xl font-semibold font-sans transition group focus:outline-none focus:ring-2 focus:ring-orange-400 ${open === idx ? 'text-orange-600' : 'text-gray-800 hover:text-orange-600'}`}
                  onClick={() => setOpen(open === idx ? null : idx)}
                >
                  <span className="flex items-center gap-3">
                    <ChevronDown className={`w-8 h-8 text-orange-400 transform transition-transform duration-200 ${open === idx ? 'rotate-180' : ''}`} />
                    <span>{idx + 1}. {faq.q}</span>
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 bg-orange-50/60 ${open === idx ? 'max-h-[500px] opacity-100 py-4' : 'max-h-0 opacity-0 py-0'}`}
                  style={{}}
                >
                  <div className="px-6 pb-2 text-gray-700 text-base leading-relaxed">
                    {faq.a.split('\n').map((line, i) => (
                      <div key={i} className="mb-2">{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Contact Card & CTA */}
          <div className="flex-1 flex flex-col gap-8 justify-start mt-10 lg:mt-0">
            <div className="bg-gradient-to-br from-orange-100 via-white to-orange-200 border border-orange-200 rounded-3xl shadow-2xl p-8 flex flex-col gap-4 items-start">
              <h3 className="text-2xl font-bold text-orange-600 mb-2 flex items-center gap-2"><HelpCircle className="w-7 h-7 text-orange-500" /> Still have questions?</h3>
              <p className="text-gray-700 text-base mb-2">If you can't find your answer here, our team is happy to help you personally.</p>
              <Link to="/contact" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 text-lg">
                <Mail className="w-5 h-5" /> Contact Us
              </Link>
            </div>
            <div className="bg-white/90 border border-orange-100 rounded-2xl shadow-lg p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-orange-500" />
                <span className="text-gray-700 font-medium">YesITryMeofficial@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-orange-500" />
                <span className="text-gray-700 font-medium">www.YesITryMe.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-orange-500" />
                <span className="text-gray-700 font-medium">Customer Care No. +91-7066916324</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ; 