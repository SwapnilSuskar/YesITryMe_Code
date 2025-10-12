import { Instagram, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

const ContactUs = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_ENDPOINTS.contact.send, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 10000);
        setForm({ name: '', email: '', message: '' });
        setError("");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to send your message. Please try again later.");
      }
    } catch (err) {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-gradient-to-br from-orange-50 via-white to-orange-100 flex flex-col items-center justify-start">
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-orange-600 mb-2 drop-shadow-lg">Contact Us</h1>
          <p className="text-lg text-gray-600 mb-4">We'd love to hear from you! Fill out the form below or reach us directly.</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-orange-100 p-8 mb-8">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-green-100 border-4 border-green-300 animate-bounce">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Thank you!</h2>
              <p className="text-green-700 text-lg mb-2">Your message has been sent successfully.</p>
              <p className="text-gray-600">We'll get back to you as soon as possible.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-orange-100 bg-white/70 focus:ring-2 focus:ring-orange-400 focus:outline-none text-gray-800 shadow-sm transition"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-orange-100 bg-white/70 focus:ring-2 focus:ring-orange-400 focus:outline-none text-gray-800 shadow-sm transition"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                <textarea
                  name="message"
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-orange-100 bg-white/70 focus:ring-2 focus:ring-orange-400 focus:outline-none text-gray-800 shadow-sm transition resize-none"
                  placeholder="Type your message..."
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 text-lg"
                disabled={loading}
              >
                <Send className="w-5 h-5" />
                {loading ? "Sending..." : "Send Message"}
              </button>
              {error && (
                <div className="text-red-600 font-semibold text-center mt-2 animate-fade-in">
                  {error}
                </div>
              )}
            </form>
          )}
        </div>
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-orange-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-100">
              <Mail className="w-5 h-5 text-orange-500" />
            </span>
            <span className="text-gray-700 font-medium">yesitrymeofficial@gmail</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-100">
              <Phone className="w-5 h-5 text-orange-500" />
            </span>
            <span className="text-gray-700 font-medium">+91 7066916324</span>
            
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-100">
              <MapPin className="w-5 h-5 text-orange-500" />
            </span>
            <span className="text-gray-700 font-medium">Beed, Maharashtra</span>
          </div>
        </div>
        {/* Instagram option centered below the others, inside a white card */}
        <div className="flex justify-center mt-6">
          <div className="bg-white rounded-2xl shadow-lg px-6 py-4 flex items-center gap-4">
            <a
              href="https://www.instagram.com/yesitryme"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
              title="Instagram"
            >
              <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-600 hover:scale-110 transition-transform duration-300">
                <Instagram className="w-5 h-5 text-white" />
              </span>
              <span className="text-gray-700 font-semibold text-lg hover:text-pink-600 transition-colors">Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs; 