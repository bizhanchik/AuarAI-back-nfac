import { motion, useInView } from 'framer-motion';
import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { 
  SparklesIcon, 
  CloudIcon, 
  CalendarIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  CameraIcon,
  ShirtIcon,
  SunIcon,
  HeartIcon
} from 'lucide-react';

const LandingPage = React.memo(() => {
  const navigate = useNavigate();

  const handleNavigation = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      <Navigation navigate={handleNavigation} />
      <HeroSection navigate={handleNavigation} />
      <WhySection />
      <HowItWorksSection />
      <SocialProofSection />
      <DemoSection />
      <FinalCTASection navigate={handleNavigation} />
      <Footer />
    </div>
  );
});

const Navigation = ({ navigate }) => (
  <motion.nav 
    initial={{ y: -100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.8 }}
    className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-xl border-b border-white/20"
  >
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex justify-between items-center">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <img 
              src="/img/logo.png" 
              alt="AuarAI Logo" 
              className="h-6 w-6 object-contain"
            />
          </div>
          <span className="text-2xl font-bold text-white">AuarAI</span>
        </motion.div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-white/20 text-white rounded-xl font-medium backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all"
        >
          Sign In
        </motion.button>
      </div>
    </div>
  </motion.nav>
);

const HeroSection = ({ navigate }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="relative pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-6xl lg:text-7xl font-black text-white mb-6 leading-tight"
              initial={{ y: 50, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Your AI Stylist.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Smarter Outfits,
              </span>{' '}
              Less Effort.
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-300 mb-8 leading-relaxed"
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              AuarAI helps you create stylish outfits tailored to your wardrobe, the weather, 
              and your daily plans — in seconds.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-2xl"
              >
                Try AuarAI Free
                <ArrowRightIcon className="inline-block ml-2 h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
              >
                Watch Demo
              </motion.button>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
      
      <FloatingElements />
    </section>
  );
};

const PhoneMockup = () => (
  <motion.div 
    className="relative max-w-sm mx-auto"
    whileHover={{ y: -10 }}
    transition={{ duration: 0.3 }}
  >
    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-3 shadow-2xl border border-gray-700">
      <div className="bg-black rounded-[2.5rem] p-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
        
        <motion.div 
          className="mt-8 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-2xl border border-blue-500/30">
            <p className="text-white text-sm font-medium">Today's Outfit</p>
            <p className="text-gray-300 text-xs mt-1">Perfect for 22°C, Sunny</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {['Top', 'Bottom', 'Shoes', 'Accessories'].map((item, i) => (
              <motion.div 
                key={item}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1 }}
                className="bg-gray-800 p-3 rounded-xl"
              >
                <div className="w-full h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-2"></div>
                <p className="text-white text-xs font-medium">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

const FloatingElements = React.memo(() => {
  const elementCount = 3;
  
  return (
    <>
      {[...Array(elementCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-40"
          style={{
            left: `${20 + i * 30}%`,
            top: `${20 + i * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5
          }}
        />
      ))}
    </>
  );
});

const WhySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const features = [
    { icon: SparklesIcon, text: "Personalized for your style" },
    { icon: CloudIcon, text: "Weather & calendar-aware" },
    { icon: ShirtIcon, text: "Works with your own wardrobe" },
    { icon: CameraIcon, text: "Amazon & video outfit check support" }
  ];

  return (
    <section ref={ref} className="py-20 px-6 relative">
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl font-bold text-white mb-6">
            Tired of wasting time picking what to wear?
          </h2>
          <p className="text-2xl text-gray-300 mb-4">Let AuarAI do the work.</p>
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
            Whether you're dressing for work, a date, or a walk — it builds perfect looks from your existing clothes.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ y: 50, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all duration-300"
              initial={{ y: 50, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <feature.icon className="h-8 w-8 text-blue-400 mx-auto mb-4" />
              <p className="text-white font-medium">{feature.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const HowItWorksSection = React.memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  const steps = [
    {
      icon: ShirtIcon,
      title: "Upload your wardrobe",
      description: "Take photos or import clothes from stores.",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: CloudIcon,
      title: "Tell us your plans & location",
      description: "AuarAI checks the weather and your calendar.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: SparklesIcon,
      title: "Get daily outfit ideas — instantly",
      description: "Dress with confidence, without overthinking.",
      color: "from-purple-500 to-violet-500"
    }
  ];

  return (
    <section ref={ref} className="py-20 px-6 bg-white/5 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-6">How It Works</h2>
          <p className="text-xl text-gray-300">Three simple steps to effortless style</p>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
});

const StepCard = React.memo(({ step, index, isInView }) => {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.15,
        ease: "easeOut"
      }}
      className="relative transform transition-transform duration-200 hover:scale-105 hover:-translate-y-2"
    >
      <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 hover:border-white/40 transition-all duration-200 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br opacity-10 rounded-full blur-xl" 
             style={{background: `linear-gradient(135deg, #3b82f6, #8b5cf6)`}}></div>
        
        <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
          <step.icon className="h-8 w-8 text-white" />
        </div>
        
        <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">{index + 1}</span>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
        <p className="text-gray-300 text-lg">{step.description}</p>
      </div>
    </motion.div>
  );
});

const SocialProofSection = React.memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  const stats = [
    { number: "5,000+", label: "outfits generated" },
    { number: "Amazon", label: "& Google Calendar integrated" },
    { number: "100%", label: "satisfaction from beta users" }
  ];

  return (
    <section ref={ref} className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 max-w-4xl mx-auto">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="h-6 w-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-2xl text-white font-medium mb-6 italic">
              "AuarAI saved me 20 minutes every morning — and my outfits got compliments!"
            </blockquote>
            <cite className="text-gray-300 text-lg">— Maria S., Beta tester</cite>
          </div>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
});

const StatCard = React.memo(({ stat, index, isInView }) => {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ 
        delay: 0.2 + index * 0.1, 
        duration: 0.5,
        ease: "easeOut"
      }}
      className="text-center bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 transform transition-transform duration-200 hover:scale-105"
    >
      <div className="text-4xl font-bold text-blue-400 mb-2">{stat.number}</div>
      <div className="text-gray-300">{stat.label}</div>
    </motion.div>
  );
});

const DemoSection = React.memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  const screens = [
    { title: "Outfit of the Day", color: "from-blue-500 to-purple-600" },
    { title: "Wardrobe Overview", color: "from-purple-500 to-pink-600" },
    { title: "AI Recommendations", color: "from-pink-500 to-rose-600" },
    { title: "Weather Integration", color: "from-cyan-500 to-blue-600" }
  ];

  return (
    <section ref={ref} className="py-20 px-6 bg-white/5 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-6">See AuarAI in Action</h2>
          <p className="text-xl text-gray-300">Experience the future of personal styling</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {screens.map((screen, index) => (
            <DemoCard key={screen.title} screen={screen} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
});

const DemoCard = React.memo(({ screen, index, isInView }) => {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      className="group cursor-pointer transform transition-transform duration-200 hover:scale-105 hover:-translate-y-2"
    >
      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-200">
        <div className={`w-full h-48 bg-gradient-to-br ${screen.color} rounded-xl mb-4 relative overflow-hidden transition-shadow duration-200 group-hover:shadow-xl`}>
          <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all duration-200"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
              <div className="h-2 bg-white/40 rounded mb-2"></div>
              <div className="h-2 bg-white/40 rounded w-2/3"></div>
            </div>
          </div>
        </div>
        <h3 className="text-white font-semibold text-center">{screen.title}</h3>
      </div>
    </motion.div>
  );
});

const FinalCTASection = ({ navigate }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm p-12 rounded-3xl border border-white/20"
        >
          <h2 className="text-5xl font-bold text-white mb-6">
            Don't waste another morning stressing your outfit.
          </h2>
          <p className="text-2xl text-gray-300 mb-8">
            Try AuarAI and let your clothes work for you.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(59, 130, 246, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')}
            className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-2xl mb-4 inline-block"
          >
            Get Early Access
            <ArrowRightIcon className="inline-block ml-3 h-6 w-6" />
          </motion.button>
          
          <p className="text-orange-400 font-medium">
            Only 100 beta spots available this month.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-12 px-6 border-t border-white/10">
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-3 gap-8 items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">AuarAI</span>
        </div>
        
        <div className="flex justify-center space-x-8">
          <a href="#" className="text-gray-400 hover:text-white transition-colors">About</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
        </div>
        
        <div className="text-center md:text-right">
          <p className="text-gray-400 flex items-center justify-center md:justify-end">
            Built with <HeartIcon className="h-4 w-4 text-red-500 mx-1" /> from Kazakhstan
          </p>
        </div>
      </div>
    </div>
  </footer>
);

export default LandingPage; 