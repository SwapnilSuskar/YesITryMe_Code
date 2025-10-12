import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import aiImg from '../../assets/courses/AIPowerAndContentCreation.png';
import webImg from '../../assets/courses/AtoZ.png';
import dataImg from '../../assets/courses/DigitalGrowthmastery.png';
import mobileImg from '../../assets/courses/socialMediaMastery.png';
import marketingImg from '../../assets/courses/videoEditing.png';
import designImg from '../../assets/courses/YoutubeMastery.png';

const courses = [
  {
    id: "a-to-z-mastery",
    title: "A to Z Mastery",
    desc: "A comprehensive course covering everything from the basics to advanced strategies in digital earning. Perfect for beginners and those looking to master the full spectrum of online opportunities.",
    img: webImg,
    badge: "All-in-One"
  },
  {
    id: "digital-growth-mastery",
    title: "Digital Growth Mastery",
    desc: "Unlock the secrets of scaling your business or personal brand online. Learn growth hacking, digital funnels, and proven methods to skyrocket your digital presence.",
    img: dataImg,
    badge: "Growth"
  },
  {
    id: "social-media-mastery",
    title: "Social Media Mastery",
    desc: "Become a social media expert! Learn how to build, engage, and monetize audiences on platforms like Instagram, Facebook, and more with real-world strategies.",
    img: mobileImg,
    badge: "Trending"
  },
  {
    id: "video-editing",
    title: "Video Editing",
    desc: "Master professional video editing for YouTube, social media, and business. Learn tools, storytelling, and editing techniques to create stunning videos that captivate.",
    img: marketingImg,
    badge: "Creative"
  },
  {
    id: "ai-power-content-creation",
    title: "AI Power & Content Creation",
    desc: "Leverage the latest AI tools for content creation, automation, and productivity. Learn how to use AI to generate ideas, write, design, and supercharge your digital workflow.",
    img: aiImg,
    badge: "AI"
  },
  {
    id: "youtube-mastery",
    title: "YouTube Mastery",
    desc: "Everything you need to launch, grow, and monetize a successful YouTube channel. From content creation to analytics and audience growth, become a YouTube pro.",
    img: designImg,
    badge: "YouTube"
  },
];

// Shimmer component
const ShimmerCard = () => (
  <div className="relative bg-white p-8 rounded-3xl shadow-xl border border-orange-100 flex flex-col items-center text-center animate-pulse">
    {/* Badge Shimmer */}
    <div className="absolute top-4 right-4 w-16 h-6 bg-gray-200 rounded-full"></div>

    {/* Image Shimmer */}
    <div className="w-full h-56 mb-8 rounded-xl bg-gray-200 flex items-center justify-center">
      <div className="w-32 h-32 bg-gray-300 rounded-lg"></div>
    </div>

    {/* Title Shimmer */}
    <div className="w-48 h-8 bg-gray-200 rounded mb-4"></div>

    {/* Description Shimmer */}
    <div className="space-y-2 w-full">
      <div className="w-full h-4 bg-gray-200 rounded"></div>
      <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
      <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const Course = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState(0);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleImageLoad = () => {
    setLoadedImages(prev => prev + 1);
  };

  // Preload images
  useEffect(() => {
    const imagePromises = courses.map(course => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          handleImageLoad();
          resolve();
        };
        img.onerror = resolve; // Handle error gracefully
        img.src = course.img;
      });
    });

    Promise.all(imagePromises).then(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section id="course" className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-extrabold text-center text-black mb-4 tracking-tight drop-shadow-sm">
            <span className="bg-gradient-to-r from-[#FF4E00] to-orange-500 bg-clip-text text-transparent">Our Courses</span>
          </h2>
          <p className="text-center text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Explore our expertly crafted courses designed to help you master digital skills, grow your brand, and unlock new opportunities in the digital world.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            {[...Array(6)].map((_, index) => (
              <ShimmerCard key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="course" className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-extrabold text-center text-black mb-4 tracking-tight drop-shadow-sm">
          <span className="bg-gradient-to-r from-[#FF4E00] to-orange-500 bg-clip-text text-transparent">Our Courses</span>
        </h2>
        <p className="text-center text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Explore our expertly crafted courses designed to help you master digital skills, grow your brand, and unlock new opportunities in the digital world.
        </p>
        <div className="grid md:grid-cols-3 gap-10">
          {courses.map((course, index) => (
            <Link
              key={index}
              to={`/courses/${course.id}`}
              className="relative bg-white p-8 rounded-3xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group hover:scale-[1.04] hover:border-orange-300 hover:bg-orange-50/60 cursor-pointer"
            >
              {/* Badge */}
              <span className="absolute top-4 right-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                {course.badge}
              </span>
              {/* Image */}
              <div className="w-full h-56 mb-8 rounded-xl overflow-hidden shadow-lg border-2 border-orange-200 bg-white flex items-center justify-center group-hover:border-orange-400 transition-all duration-300">
                <img
                  src={course.img}
                  alt={course.title}
                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  style={{ background: '#fff' }}
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-orange-600 group-hover:text-orange-700 transition-colors duration-200">
                {course.title}
              </h3>
              <p className="text-gray-700 text-base leading-relaxed mb-2">
                {course.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Course; 