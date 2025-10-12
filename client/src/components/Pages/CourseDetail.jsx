import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Lock,
  Play,
  ShoppingCart,
  Star,
  Users,
  Video
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import aiImg from '../../assets/courses/AIPowerAndContentCreation.png';
import webImg from '../../assets/courses/AtoZ.png';
import dataImg from '../../assets/courses/DigitalGrowthmastery.png';
import mobileImg from '../../assets/courses/socialMediaMastery.png';
import marketingImg from '../../assets/courses/videoEditing.png';
import designImg from '../../assets/courses/YoutubeMastery.png';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';

// Course data with detailed content
const courseData = {
  "a-to-z-mastery": {
    id: "a-to-z-mastery",
    title: "A to Z Mastery",
    subtitle: "Complete Digital Earning Mastery Course",
    description: "A comprehensive course covering everything from the basics to advanced strategies in digital earning. Perfect for beginners and those looking to master the full spectrum of online opportunities.",
    image: webImg,
    badge: "All-in-One",
    duration: "12 weeks",
    lectures: 48,
    students: 1250,
    rating: 4.8,
    price: "₹2,999",
    instructor: "Avishkar Kakde",
    lastUpdated: "2024-01-15",
    requirements: [
      "Basic computer knowledge",
      "Internet connection",
      "Smartphone or laptop",
      "Willingness to learn"
    ],
    whatYouWillLearn: [
      "Complete understanding of digital earning opportunities",
      "Step-by-step affiliate marketing strategies",
      "Social media monetization techniques",
      "Content creation and marketing",
      "Building passive income streams",
      "Advanced digital marketing tactics"
    ],
    sections: [
      {
        id: 1,
        title: "Introduction to Digital Earning",
        lectures: 6,
        duration: "2 hours",
        isCompleted: false,
        lectures: [
          { 
            id: 1,
            title: "Welcome to Digital Earning",
            duration: "15 min",
            type: "video",
            isPreview: true,
            isCompleted: false,
            description: "Introduction to the course and what you'll learn"
          },
          {
            id: 2,
            title: "Understanding the Digital Economy",
            duration: "20 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Overview of how money flows in the digital world"
          },
          {
            id: 3,
            title: "Setting Up Your Workspace",
            duration: "25 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Essential tools and software you'll need"
          },
          {
            id: 4,
            title: "Course Resources & Materials",
            duration: "10 min",
            type: "download",
            isPreview: false,
            isCompleted: false,
            description: "Download course materials and resources"
          },
          {
            id: 5,
            title: "Your First Assignment",
            duration: "30 min",
            type: "assignment",
            isPreview: false,
            isCompleted: false,
            description: "Complete your first practical assignment"
          },
          {
            id: 6,
            title: "Section Quiz",
            duration: "20 min",
            type: "quiz",
            isPreview: false,
            isCompleted: false,
            description: "Test your knowledge from this section"
          }
        ]
      },    
    ]
  },
  "digital-growth-mastery": {
    id: "digital-growth-mastery",
    title: "Digital Growth Mastery",
    subtitle: "Scale Your Business Online",
    description: "Unlock the secrets of scaling your business or personal brand online. Learn growth hacking, digital funnels, and proven methods to skyrocket your digital presence.",
    image: dataImg,
    badge: "Growth",
    duration: "8 weeks",
    lectures: 32,
    students: 890,
    rating: 4.9,
    price: "₹1,999",
    instructor: "Avishkar Kakde",
    lastUpdated: "2024-01-10",
    requirements: [
      "Basic business knowledge",
      "Internet connection",
      "Willingness to implement strategies"
    ],
    whatYouWillLearn: [
      "Growth hacking techniques",
      "Digital funnel optimization",
      "Customer acquisition strategies",
      "Scaling business operations",
      "Data-driven decision making",
      "Advanced marketing automation"
    ],
    sections: [
      {
        id: 1,
        title: "Growth Hacking Fundamentals",
        lectures: 6,
        duration: "2.5 hours",
        isCompleted: false,
        lectures: [
          {
            id: 1,
            title: "Introduction to Growth Hacking",
            duration: "20 min",
            type: "video",
            isPreview: true,
            isCompleted: false,
            description: "Understanding growth hacking principles"
          },
          {
            id: 2,
            title: "The Growth Funnel",
            duration: "25 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Building effective growth funnels"
          },
          {
            id: 3,
            title: "Customer Acquisition",
            duration: "30 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Strategies for acquiring customers"
          },
          {
            id: 4,
            title: "Growth Hacking Tools",
            duration: "15 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Essential tools for growth hackers"
          },
          {
            id: 5,
            title: "Growth Hacking Resources",
            duration: "10 min",
            type: "download",
            isPreview: false,
            isCompleted: false,
            description: "Download growth hacking guides"
          },
          {
            id: 6,
            title: "Section Assignment",
            duration: "40 min",
            type: "assignment",
            isPreview: false,
            isCompleted: false,
            description: "Create your growth strategy"
          }
        ]
      }
    ]
  },
  "social-media-mastery": {
    id: "social-media-mastery",
    title: "Social Media Mastery",
    subtitle: "Build, Engage & Monetize Your Audience",
    description: "Become a social media expert! Learn how to build, engage, and monetize audiences on platforms like Instagram, Facebook, and more with real-world strategies.",
    image: mobileImg,
    badge: "Trending",
    duration: "10 weeks",
    lectures: 40,
    students: 2100,
    rating: 4.7,
    price: "₹1,799",
    instructor: "Avishkar Kakde",
    lastUpdated: "2024-01-12",
    requirements: [
      "Basic social media knowledge",
      "Smartphone or computer",
      "Active social media accounts",
      "Creativity and consistency"
    ],
    whatYouWillLearn: [
      "Platform-specific strategies for Instagram, Facebook, TikTok",
      "Content creation and curation techniques",
      "Audience building and engagement strategies",
      "Social media monetization methods",
      "Analytics and performance tracking",
      "Influencer marketing and collaborations"
    ],
    sections: [
      {
        id: 1,
        title: "Social Media Fundamentals",
        lectures: 6,
        duration: "2 hours",
        isCompleted: false,
        lectures: [
          {
            id: 1,
            title: "Introduction to Social Media Marketing",
            duration: "20 min",
            type: "video",
            isPreview: true,
            isCompleted: false,
            description: "Understanding social media marketing basics"
          },
          {
            id: 2,
            title: "Choosing Your Platforms",
            duration: "25 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Selecting the right platforms for your niche"
          },
          {
            id: 3,
            title: "Creating Your Brand Identity",
            duration: "30 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Building a consistent brand across platforms"
          },
          {
            id: 4,
            title: "Content Strategy Planning",
            duration: "35 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Developing a content calendar and strategy"
          },
          {
            id: 5,
            title: "Social Media Tools & Apps",
            duration: "20 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Essential tools for social media management"
          },
          {
            id: 6,
            title: "Section Assignment",
            duration: "45 min",
            type: "assignment",
            isPreview: false,
            isCompleted: false,
            description: "Create your social media strategy plan"
          }
        ]
      }
    ]
  },
  "video-editing": {
    id: "video-editing",
    title: "Video Editing",
    subtitle: "Professional Video Creation Mastery",
    description: "Master professional video editing for YouTube, social media, and business. Learn tools, storytelling, and editing techniques to create stunning videos that captivate.",
    image: marketingImg,
    badge: "Creative",
    duration: "8 weeks",
    lectures: 35,
    students: 1650,
    rating: 4.6,
    price: "₹1,599",
    instructor: "Avishkar Kakde",
    lastUpdated: "2024-01-08",
    requirements: [
      "Computer with video editing software",
      "Basic computer skills",
      "Creative mindset",
      "Patience for learning"
    ],
    whatYouWillLearn: [
      "Professional video editing techniques",
      "Storytelling through video",
      "Color grading and effects",
      "Audio editing and mixing",
      "Video optimization for different platforms",
      "Advanced editing workflows"
    ],
    sections: [
      {
        id: 1,
        title: "Video Editing Basics",
        lectures: 5,
        duration: "2.5 hours",
        isCompleted: false,
        lectures: [
          {
            id: 1,
            title: "Introduction to Video Editing",
            duration: "25 min",
            type: "video",
            isPreview: true,
            isCompleted: false,
            description: "Understanding video editing fundamentals"
          },
          {
            id: 2,
            title: "Choosing Your Editing Software",
            duration: "20 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Comparing popular video editing tools"
          },
          {
            id: 3,
            title: "Basic Editing Techniques",
            duration: "35 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Cutting, trimming, and basic transitions"
          },
          {
            id: 4,
            title: "Video Editing Resources",
            duration: "10 min",
            type: "download",
            isPreview: false,
            isCompleted: false,
            description: "Download editing templates and resources"
          },
          {
            id: 5,
            title: "First Edit Assignment",
            duration: "60 min",
            type: "assignment",
            isPreview: false,
            isCompleted: false,
            description: "Create your first edited video"
          }
        ]
      }
    ]
  },
  "ai-power-content-creation": {
    id: "ai-power-content-creation",
    title: "AI Power & Content Creation",
    subtitle: "Leverage AI for Digital Success",
    description: "Leverage the latest AI tools for content creation, automation, and productivity. Learn how to use AI to generate ideas, write, design, and supercharge your digital workflow.",
    image: aiImg,
    badge: "AI",
    duration: "6 weeks",
    lectures: 28,
    students: 980,
    rating: 4.9,
    price: "₹2,499",
    instructor: "Avishkar Kakde",
    lastUpdated: "2024-01-20",
    requirements: [
      "Basic computer knowledge",
      "Internet connection",
      "Openness to new technology",
      "Creative thinking"
    ],
    whatYouWillLearn: [
      "AI-powered content generation",
      "Automation tools and workflows",
      "AI for design and graphics",
      "Productivity enhancement with AI",
      "Ethical AI usage",
      "Future of AI in digital marketing"
    ],
    sections: [
      {
        id: 1,
        title: "AI Fundamentals",
        lectures: 4,
        duration: "2 hours",
        isCompleted: false,
        lectures: [
          {
            id: 1,
            title: "Introduction to AI in Content Creation",
            duration: "30 min",
            type: "video",
            isPreview: true,
            isCompleted: false,
            description: "Understanding AI's role in content creation"
          },
          {
            id: 2,
            title: "Popular AI Tools Overview",
            duration: "25 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Exploring top AI content creation tools"
          },
          {
            id: 3,
            title: "AI Content Generation",
            duration: "35 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Using AI for text, image, and video creation"
          },
          {
            id: 4,
            title: "AI Tools Directory",
            duration: "10 min",
            type: "download",
            isPreview: false,
            isCompleted: false,
            description: "Comprehensive list of AI tools and resources"
          }
        ]
      }
    ]
  },
  "youtube-mastery": {
    id: "youtube-mastery",
    title: "YouTube Mastery",
    subtitle: "Build a Successful YouTube Channel",
    description: "Everything you need to launch, grow, and monetize a successful YouTube channel. From content creation to analytics and audience growth, become a YouTube pro.",
    image: designImg,
    badge: "YouTube",
    duration: "10 weeks",
    lectures: 42,
    students: 1850,
    rating: 4.8,
    price: "₹2,199",
    instructor: "Avishkar Kakde",
    lastUpdated: "2024-01-18",
    requirements: [
      "YouTube account",
      "Camera or smartphone",
      "Basic video editing knowledge",
      "Consistency and patience"
    ],
    whatYouWillLearn: [
      "YouTube channel optimization",
      "Content strategy and planning",
      "Video SEO and discoverability",
      "Audience engagement techniques",
      "YouTube monetization strategies",
      "Analytics and performance tracking"
    ],
    sections: [
      {
        id: 1,
        title: "YouTube Channel Setup",
        lectures: 5,
        duration: "2 hours",
        isCompleted: false,
        lectures: [
          {
            id: 1,
            title: "Creating Your YouTube Channel",
            duration: "20 min",
            type: "video",
            isPreview: true,
            isCompleted: false,
            description: "Step-by-step channel creation guide"
          },
          {
            id: 2,
            title: "Channel Branding & Design",
            duration: "25 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Creating professional channel branding"
          },
          {
            id: 3,
            title: "Channel Optimization",
            duration: "30 min",
            type: "video",
            isPreview: false,
            isCompleted: false,
            description: "Optimizing your channel for maximum visibility"
          },
          {
            id: 4,
            title: "YouTube Branding Templates",
            duration: "10 min",
            type: "download",
            isPreview: false,
            isCompleted: false,
            description: "Download channel branding templates"
          },
          {
            id: 5,
            title: "Channel Setup Assignment",
            duration: "45 min",
            type: "assignment",
            isPreview: false,
            isCompleted: false,
            description: "Set up your YouTube channel"
          }
        ]
      }
    ]
  }
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [expandedSections, setExpandedSections] = useState(new Set([1])); // First section expanded by default
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPurchases, setUserPurchases] = useState([]);
  const [paymentVerifications, setPaymentVerifications] = useState([]);
  const [hasPurchasedPackage, setHasPurchasedPackage] = useState(false);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const courseInfo = courseData[courseId];
      if (courseInfo) {
        setCourse(courseInfo);
        setSelectedLecture(courseInfo.sections[0]?.lectures[0] || null);
      }
      setLoading(false);
    }, 1000);
  }, [courseId]);

  // Check if user has purchased any package
  useEffect(() => {
    const checkUserPurchases = async () => {
      if (user && token) {
        try {
          // Fetch user purchases
          const purchasesResponse = await api.get(`${API_ENDPOINTS.packages.purchases}`);
          if (purchasesResponse.data.success) {
            setUserPurchases(purchasesResponse.data.data.purchases);
          }

          // Fetch payment verifications
          const verificationsResponse = await api.get(API_ENDPOINTS.payment.status);
          if (verificationsResponse.data.success) {
            setPaymentVerifications(verificationsResponse.data.data.verifications || []);
          }

          // Check if user has any verified purchases
          const hasVerifiedPurchase = purchasesResponse.data.success &&
            purchasesResponse.data.data.purchases.some(purchase => purchase.status === 'active');

          const hasVerifiedPayment = verificationsResponse.data.success &&
            verificationsResponse.data.data.verifications.some(verification => verification.status === 'verified');

          setHasPurchasedPackage(hasVerifiedPurchase || hasVerifiedPayment);
        } catch (error) {
          console.error('Error checking user purchases:', error);
        }
      }
    };

    checkUserPurchases();
  }, [user, token]);

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getLectureIcon = (type) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'download':
        return <Download className="w-4 h-4" />;
      case 'assignment':
        return <FileText className="w-4 h-4" />;
      case 'quiz':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const getLectureTypeColor = (type) => {
    switch (type) {
      case 'video':
        return 'text-blue-600 bg-blue-100';
      case 'download':
        return 'text-green-600 bg-green-100';
      case 'assignment':
        return 'text-purple-600 bg-purple-100';
      case 'quiz':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Course Image */}
              <div className="lg:w-1/3">
                <div className="relative">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="max-h-full max-w-60 object-contain rounded-xl shadow-lg"
                  />
                  <span className="absolute top-4 right-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {course.badge}
                  </span>
                </div>
              </div>
              {/* Course Info */}
              <div className="lg:w-2/3">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{course.title}</h1>
                <p className="text-xl text-gray-600 mb-4">{course.subtitle}</p>
                <p className="text-gray-700 mb-6 leading-relaxed">{course.description}</p>

                {/* Course Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold">{course.duration}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="text-sm text-gray-600">Lectures</div>
                    <div className="font-semibold">{course.lectures}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-sm text-gray-600">Students</div>
                    <div className="font-semibold">{course.students.toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-orange-600 mb-1">
                      <Star className="w-5 h-5" />
                    </div>
                    <div className="text-sm text-gray-600">Rating</div>
                    <div className="font-semibold">{course.rating}</div>
                  </div>
                </div>

                {/* Instructor & Price */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Instructor</div>
                    <div className="font-semibold text-gray-800">{course.instructor}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">{course.price}</div>
                    <div className="text-sm text-gray-600">One-time payment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access Notice */}
        {!user && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800">Login Required</h3>
                <p className="text-blue-700 text-sm">Please login to view course content and purchase packages</p>
              </div>
            </div>
          </div>
        )}

        {user && !hasPurchasedPackage && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800">Package Purchase Required</h3>
                <p className="text-yellow-700 text-sm">Purchase a package to unlock full access to all course content</p>
              </div>
              <button
                onClick={() => navigate('/packages')}
                className="ml-auto bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                View Packages
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Course Content</h2>

              <div className="space-y-4">
                {course.sections.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="w-5 h-5 text-orange-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-orange-600" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-800">{section.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{section.lectures.length} lectures</span>
                            <span>•</span>
                            <span>{section.duration}</span>
                          </div>
                        </div>
                      </div>
                      {section.isCompleted && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </button>
                    {expandedSections.has(section.id) && (
                      <div className="border-t border-gray-200">
                        {section.lectures.map((lecture) => (
                          <div
                            key={lecture.id}
                            className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedLecture?.id === lecture.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                              }`}
                            onClick={() => setSelectedLecture(lecture)}
                          >
                            <div className={`p-2 rounded-full ${getLectureTypeColor(lecture.type)}`}>
                              {getLectureIcon(lecture.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-800">{lecture.title}</h4>
                                {lecture.isPreview && (
                                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Preview</span>
                                )}
                                {lecture.isCompleted && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{lecture.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">{lecture.duration}</span>
                              {!user && (
                                <Lock className="w-4 h-4 text-gray-400" />
                              )}
                              {user && !hasPurchasedPackage && !lecture.isPreview && (
                                <Lock className="w-4 h-4 text-yellow-500" />
                              )}
                              {user && hasPurchasedPackage && !lecture.isCompleted && (
                                <Play className="w-4 h-4 text-green-500" />
                              )}
                              {lecture.isCompleted && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Requirements */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Requirements</h3>
              <ul className="space-y-2">
                {course.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What You'll Learn */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">What You'll Learn</h3>
              <ul className="space-y-2">
                {course.whatYouWillLearn.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Course Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Course Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Last Updated</div>
                    <div className="font-medium">{new Date(course.lastUpdated).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Certificate</div>
                    <div className="font-medium">Yes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Lecture Preview */}
        {selectedLecture && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${getLectureTypeColor(selectedLecture.type)}`}>
                {getLectureIcon(selectedLecture.type)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedLecture.title}</h3>
                <p className="text-gray-600">{selectedLecture.description}</p>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="text-gray-500 mb-4">
                {selectedLecture.type === 'video' && <Video className="w-16 h-16 mx-auto mb-4" />}
                {selectedLecture.type === 'download' && <Download className="w-16 h-16 mx-auto mb-4" />}
                {selectedLecture.type === 'assignment' && <FileText className="w-16 h-16 mx-auto mb-4" />}
                {selectedLecture.type === 'quiz' && <BookOpen className="w-16 h-16 mx-auto mb-4" />}
              </div>

              {!user ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <AlertCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-blue-800 font-medium mb-2">Login Required</p>
                    <p className="text-blue-700 text-sm">Please login to access course content</p>
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Login to Access
                  </button>
                </div>
              ) : !hasPurchasedPackage ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <Lock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-yellow-800 font-medium mb-2">Package Purchase Required</p>
                    <p className="text-yellow-700 text-sm">
                      {selectedLecture.isPreview
                        ? "This is a preview lecture. Purchase a package to access all content."
                        : "Purchase a package to access this lecture."
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/packages')}
                    className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Purchase Package
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-800 font-medium mb-2">Access Granted</p>
                    <p className="text-green-700 text-sm">
                      {selectedLecture.isPreview
                        ? "This is a preview lecture. You have access to all course content."
                        : "You have access to this lecture."
                      }
                    </p>
                  </div>
                  <button className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors">
                    Start Learning
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail; 