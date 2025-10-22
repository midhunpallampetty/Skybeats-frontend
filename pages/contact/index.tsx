import React, { useEffect, useState } from 'react';
import { Mail, MapPin, Phone, Clock, Send } from 'lucide-react';
import { toast } from "sonner";
import dynamic from 'next/dynamic';
// Simple loading spinner component (create this at components/LoadingSpinner.tsx)
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-32">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
  </div>
);

const Contact: React.FC = () => {
  const Navbar=dynamic(()=>import('../../components/Navbar'),{ssr:false})
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Message sent successfully", {
        description: "We'll get back to you as soon as possible.",
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      toast.error("Failed to send message", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    const img = new Image();
    img.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop';
    img.onload = () => setImageLoaded(true);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <Navbar/>
      {/* Background image */}
      <div 
        className={`absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          backgroundImage: 'url(\'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop\')',
          transform: 'scale(1.05)',
        }}
      ></div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-indigo-800/80 to-blue-900/70 z-10"></div>
      
      {/* Main content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-sm font-medium text-white mb-4 animate-fade-in">
                Get in Touch
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">CONTACT</span>
              </h1>
              <p className="text-xl text-white/90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Your Skybeats journey starts here. We welcome the opportunity to tell you more 
                about our singular and spectacular experiences.
              </p>
            </div>
            
            <div className="w-full max-w-6xl mx-auto glass-card rounded-2xl p-1 animate-scale-in" style={{ animationDelay: '0.3s', background: 'linear-gradient(90deg, rgba(236,72,153,0.3) 0%, rgba(109,40,217,0.3) 100%)' }}>
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Contact Info */}
                  <div className="space-y-6">
                    <div className="flex flex-col">
                      <span className="text-sm uppercase tracking-wider text-indigo-200 mb-1 font-medium">Location</span>
                      <div className="flex items-start gap-3">
                        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white border border-white/30 mb-2">
                          <MapPin className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-lg font-medium text-white">Skybeats Headquarters</p>
                          <p className="text-indigo-200">123 Altitude Avenue</p>
                          <p className="text-indigo-200">Bangalore, 560001, India</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm uppercase tracking-wider text-indigo-200 mb-1 font-medium">Contact</span>
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white border border-white/30 mb-2">
                          <Phone className="h-5 w-5" />
                        </span>
                        <a href="tel:+911234567890" className="text-lg text-white hover:text-pink-300 transition-colors">
                          +91 123 456 7890
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm uppercase tracking-wider text-indigo-200 mb-1 font-medium">Email</span>
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white border border-white/30 mb-2">
                          <Mail className="h-5 w-5" />
                        </span>
                        <a href="mailto:info@skybeats.com" className="text-lg text-white hover:text-pink-300 transition-colors">
                          info@skybeats.com
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm uppercase tracking-wider text-indigo-200 mb-1 font-medium">Operating Hours</span>
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white border border-white/30 mb-2">
                          <Clock className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-lg font-medium text-white">Monday - Friday</p>
                          <p className="text-indigo-200">9:00 AM - 6:00 PM IST</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="name" className="text-sm uppercase tracking-wider text-indigo-200 mb-1 font-medium">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        placeholder="Your name"
                        className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white w-full placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all duration-300"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="text-sm uppercase tracking-wider text-indigo-200 mb-1 font-medium">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        placeholder="Your email"
                        className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white w-full placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all duration-300"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="text-sm uppercase tracking-wider text-indigo-200 mb-1 font-medium">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        placeholder="Your message"
                        rows={4}
                        className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white w-full placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all duration-300 resize-none"
                        value={formData.message}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="group flex items-center justify-center gap-2 w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;