const About = () => {
  const stats = [
    { number: "1000+", label: "Students Enrolled" },
    { number: "50+", label: "Expert Instructors" },
    { number: "95%", label: "Success Rate" }
  ];

  return (
    <section id="about" className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-black mb-8">
          About Us
        </h2>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          YesITryMe Marketing IND LLP was founded on 1 AUGUST 2025. YesITryMe Marketing LLP is a unique affiliate marketing Platform that offers a wide range of COURSES and SERVICES for Promotion and Sale. Our Platform Features a Unique “Refer and Earn“ program, enabling you to earn a substantial income from the comfort of your home. At YesITryMe MarketingLLP, we provide an exceptional opportunity for Individuals who aspire to achieve their financial goals and fulfill their dreams. Our Platform is rapidly emerging as a leader in the field of affiliate marketing in India, empowering numerous individuals to realize significant earnings through our system. At YesITryMe, We aim to level up every family in our country wishing to attain financial freedom.
        </p>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          YesITryMe is dedicated to providing high-quality education and training in the field of technology. Our mission is to empower individuals with the skills they need to succeed in the digital age.
        </p>
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-[#FF4E00] mb-2">{stat.number}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
