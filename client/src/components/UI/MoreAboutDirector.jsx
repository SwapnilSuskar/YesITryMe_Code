import Director1 from "../../assets/Images/Director1.png";
import Director2 from "../../assets/Images/Director2.jpg";
import Director3 from "../../assets/Images/Director3.jpg";


const DirectorCard = ({ image, title, subtitle, message, borderColor }) => (
  <div className="flex flex-col items-center text-center gap-4 bg-white/80 rounded-xl shadow-xl border-2 border-orange-500 transition-transform hover:scale-[1.02] p-6 h-full">
    <div className="w-87 h-77 overflow-hidden   ring-2 ring-white mx-auto  flex-shrink-0">
      <img src={image} alt={title} className="w-full h-full object-cover" />
    </div>
    <div className="flex-1 flex flex-col justify-between w-full">
      <h3 className="font-extrabold text-2xl text-indigo-800 mb-1">{title}</h3>
      <p className="font-semibold text-lg text-purple-700 italic mb-2">{subtitle}</p>
      <div className="text-sm text-gray-700 leading-relaxed">{message}</div>
    </div>
  </div>
);

const MoreAboutDirector = () => {
  return (
    <div className="w-full bg-gradient-to-br from-[#fff7ed] via-white to-[#fff1e0] px-4 sm:px-10 py-16 sm:py-24 relative overflow-hidden mt-0 mb-0">
      <div className="text-center mb-12 sm:mb-20">
        <h2
          className="whitespace-nowrap text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4"
          style={{
            fontFamily: 'Roboto',
            fontWeight: '900',
            color: '#FF5722',
            letterSpacing: '1px',
            borderBottom: '7px solid #14aa00ff',
            display: 'inline-block',
            padding: '0.39em 1em',
            borderRadius: '2.75em',
            background: 'rgba(255,255,255,0.10)',
          }}
        >
          Meet Our Visionary Leaders
        </h2>
        <p
          className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-medium mt-4"
          style={{
            fontFamily: 'Roboto',
            color: '#000000ff',
            fontSize: '1.125rem',
            fontWeight: '500',

          }}
        >
          Discover the inspiring minds driving <span className="font-bold text-orange-600">YesITryMe's</span> mission for digital empowerment and financial independence.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <DirectorCard
          image={Director1}
          title="Mr. Swapnil Suskar"
          subtitle="Founder | Director | CEO – YesITryMe Marketing LLP"
          message={
            <>
              <span className="block font-semibold text-orange-600 mb-1">
                Digital Marketing Expert | Network Mentor | Visionary Entrepreneur.
              </span>
              <span className="block font-bold text-green-700 mt-2 mb-1">🌟 Vision </span>
              <span className="block text-gray-700 mb-2">
                "To Empower Every Aspiring Entrepreneur and Network Marketing Leader with the Knowledge, Tools, and Digital Skills Needed to Achieve Financial Freedom and Time Freedom by Building Powerful, Purpose-Driven Networks."
              </span>
              <span className="block font-bold text-blue-700 mb-1">🎯 Mission </span>
              <span className="block text-gray-700 mb-2">
                "To Educate, Train, And Inspire Over 10 Million People In Digital And Affiliate Marketing, Helping Them Create Income Opportunities Through Powerful Online Platforms And Structured Network-Building Strategies."
              </span>
              <ul className="list-disc ml-5 text-gray-600 text-sm space-y-1 mt-2 text-left">
                <li>Teach People How To Grow Their Business Through Digital Marketing</li>
                <li>Empower Individuals With Real, Practical Skills In Social Media, Lead Generation, And Personal Branding.</li>
                <li>Guide Network Leaders To Build High-Income Teams Using Modern Tools And Strategies.</li>

              </ul>
            </>
          }
          borderColor="border-orange-400"
        />
        <DirectorCard
          image={Director3}
          title="Mr. Vikas Jadhav"
          subtitle="BDM & Marketing Head – YesITryMe Marketing LLP."
          message={
            <>
              <span className="block font-semibold text-pink-700 mb-1">
                Business Development Specialist | Marketing Visionary | Team Builder
              </span>
              <span className="block font-bold text-orange-600 mt-2 mb-1">🌟 Vision</span>
              <span className="block text-gray-700 mb-2">
                "To Drive The Prosperity And Advancement Of YesITryMe By Fostering Innovation, Expanding Opportunities, And Ensuring Every Individual Has Access To Quality Education And Employment."
              </span>
              <span className="block font-bold text-blue-700 mb-1">🎯 Mission </span>
              <span className="block text-gray-700 mb-2">
                "To Create A Dynamic And Inclusive Environment Where Everyone Can Learn, Grow, And Succeed Together."
              </span>
              <ul className="list-disc ml-5 text-gray-600 text-sm space-y-1 mt-2 text-left">
                <li>Leads Marketing Initiatives To Expand YesITryMe’s Reach And Impact.</li>
                <li>Focuses on Providing Employment And Growth Opportunities For All.</li>
                <li>Committed To Delivering The Best Education And Training Resources.</li>
              </ul>
            </>
          }
          borderColor="border-pink-400"
        />
      </div>
    </div>
  );
};

export default MoreAboutDirector;