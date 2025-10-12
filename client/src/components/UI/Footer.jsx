import {
  BookOpen,
  Facebook,
  FileText,
  Home,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Send,
  Users,
  Youtube
} from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "../../assets/Logo2.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">

          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <img src={Logo} alt="YesITryMe Logo" className="w-24 h-14 object-contain" />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Empowering learners worldwide with cutting-edge technology education.
              Join thousands of students who have transformed their careers with YesITryMe.
            </p>
            <div className="flex space-x-4">
              <Link to="https://youtube.com/@swapnilsuskar?si=StUp1DtoCfnXpIMc" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <Youtube className="w-5 h-5" />
              </Link>
              <Link to="https://t.me/yesitrymeofficial" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <Send className="w-5 h-5" />
              </Link>
              <Link to="https://www.fb.com/l/6lp1kJRRR" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
              <Facebook className="w-5 h-5" />
              </Link>
              <Link to="https://whatsapp.com/channel/0029Vb6YB62CxoAoJDZGNW44" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-5 h-5" />
              </Link>
              <Link to="https://www.instagram.com/yesitryme" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
              <Instagram className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                  <Home className="w-4 h-4 mr-3 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                  Home
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                  <BookOpen className="w-4 h-4 mr-3 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/package" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                  <Package className="w-4 h-4 mr-3 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                  Packages
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                  <Users className="w-4 h-4 mr-3 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-orange-400 transition-colors duration-300 flex items-center group">
                  <FileText className="w-4 h-4 mr-3 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          

          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-green-400 to-teal-500 bg-clip-text text-transparent">
              Contact Us
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm">395,MAHADEV NAGAR, BEHIND DEVAKATE HOSPITAL ARVI,AT PO ARVI TAL SHIRUR KASAR DIST BEED PINCODE-413249, INDIA</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm">YesITryMeofficial@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Customer Care:- +91 7066916324</p>
                  <p className="text-gray-300 text-sm">Mon-Fri: 9AM-6PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} YesITryMe. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-orange-400 transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-orange-400 transition-colors duration-300">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-orange-400 transition-colors duration-300">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer; 