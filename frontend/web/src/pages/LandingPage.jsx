import { motion, useInView } from 'framer-motion';
import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
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
  HeartIcon,
  TrendingUpIcon,
  ZapIcon,
  EyeIcon
} from 'lucide-react';

const LandingPage = React.memo(() => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleNavigation = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Stunning Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-primary opacity-30 rounded-full blur-3xl"
          animate={{
            y: [0, -50, 0],
            x: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 right-20 w-80 h-80 bg-gradient-secondary opacity-25 rounded-full blur-3xl"
          animate={{
            y: [0, 60, 0],
            x: [0, -40, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-ocean opacity-20 rounded-full blur-3xl"
          animate={{
            y: [0, -40, 0],
            x: [0, 50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 6
          }}
        />
        <motion.div
          className="absolute top-10 right-1/3 w-64 h-64 bg-gradient-sunset opacity-25 rounded-full blur-2xl"
          animate={{
            y: [0, 35, 0],
            x: [0, -25, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <Navigation navigate={handleNavigation} />
      <HeroSection navigate={handleNavigation} />
      <WhySection />
      <HowItWorksSection />
      {/* <SocialProofSection /> */}
      {/* <DemoSection /> */}
      <FinalCTASection navigate={handleNavigation} />
      <Footer />
    </div>
  );
});

const Navigation = ({ navigate }) => {
  const { t } = useLanguage();
  
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 w-full z-50 nav-glass"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-14 h-14 logo-white-bg rounded-3xl flex items-center justify-center shadow-bold">
              <img 
                src="/img/logo.png" 
                alt="AuarAI Logo" 
                className="h-9 w-9 object-contain"
              />
            </div>
            <span className="text-4xl font-calora text-neutral-900">AuarAI</span>
          </motion.div>
          
          <div className="flex items-center space-x-4">
            {/* <LanguageSelector variant="light" /> */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="btn-ghost"
            >
              {t('signIn')}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

const HeroSection = ({ navigate }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const { t } = useLanguage();

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
              className="text-4xl lg:text-6xl font-ultra-bold text-neutral-900 mb-4 leading-tight font-display"
              initial={{ y: 50, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('heroTitle')}{' '}
              <span className="text-gradient-primary">
                {t('heroSubtitle')}
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-2xl text-neutral-700 mb-10 leading-relaxed font-subheading font-medium"
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t('heroDescription')}
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6"
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "var(--shadow-glow-primary)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="btn-primary text-xl py-5 px-10 shadow-glow-primary"
              >
                {t('tryFree')}
                <ArrowRightIcon className="inline-block ml-3 h-6 w-6" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-ghost text-xl py-5 px-10"
              >
                {t('watchDemo')}
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

const PhoneMockup = () => {
  const { t } = useLanguage();
  
  return (
    <motion.div 
      className="relative max-w-sm mx-auto hover-lift"
      whileHover={{ y: -15 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative bg-gradient-secondary rounded-[3rem] p-4 shadow-dramatic border-4 border-secondary-300">
        <div className="bg-neutral-900 rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-2xl"></div>
          
          <motion.div 
            className="mt-10 space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="card-glass p-6 border-2 border-primary-300/50">
              <p className="text-white text-lg font-bold font-heading">{t('outfitOfDay')}</p>
              <p className="text-primary-300 text-sm mt-2 font-subheading">Perfect for 22°C, Sunny</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {['Top', 'Bottom', 'Shoes', 'Accessories'].map((item, i) => (
                <motion.div 
                  key={item}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                  className="card-elegant p-4"
                >
                  <div className="w-full h-20 bg-gradient-primary rounded-xl mb-3"></div>
                  <p className="text-neutral-800 text-sm font-bold font-heading">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const FloatingElements = React.memo(() => {
  const elementCount = 8;
  
  return (
    <>
      {[...Array(elementCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-primary-400 rounded-full opacity-70"
          style={{
            left: `${10 + i * 12}%`,
            top: `${25 + i * 10}%`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.4, 0.9, 0.4],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.7
          }}
        />
      ))}
    </>
  );
});

const WhySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const { t } = useLanguage();

  const features = [
    { icon: SparklesIcon, text: t('personalizedStyle') },
    { icon: CloudIcon, text: t('weatherAware') },
    { icon: ShirtIcon, text: t('ownWardrobe') },
    { icon: CameraIcon, text: t('videoSupport') }
  ];

  return (
    <section ref={ref} className="py-24 px-6 relative glass-light">
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-6xl font-ultra-bold text-neutral-900 mb-8 font-display">
            Tired of wasting time picking what to wear?
          </h2>
          <p className="text-3xl text-primary-600 mb-6 font-elegant">Let AuarAI do the work.</p>
          <p className="text-2xl text-neutral-700 mb-16 max-w-4xl mx-auto font-subheading">
            Whether you're dressing for work, a date, or a walk — it builds perfect looks from your existing clothes.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          initial={{ y: 50, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ 
                y: -4,
                scale: 1.02,
                transition: { duration: 0.15, ease: "easeOut" }
              }}
              whileTap={{ scale: 0.98 }}
              className="card-premium p-8"
              initial={{ y: 50, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
            >
              <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-primary">
                <feature.icon className="h-10 w-10 text-white" />
              </div>
              <p className="text-neutral-800 font-bold font-heading text-lg">{feature.text}</p>
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
  const { t } = useLanguage();

  const steps = [
    {
      icon: ShirtIcon,
      title: t('uploadWardrobe'),
      description: t('uploadDescription'),
      color: "bg-gradient-primary"
    },
    {
      icon: CloudIcon,
      title: t('tellPlans'),
      description: t('plansDescription'),
      color: "bg-gradient-secondary"
    },
    {
      icon: SparklesIcon,
      title: t('getOutfits'),
      description: t('outfitsDescription'),
      color: "bg-gradient-ocean"
    }
  ];

  return (
    <section ref={ref} className="py-24 px-6 glass-primary">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <h2 className="text-6xl font-ultra-bold text-neutral-900 mb-8 font-display">{t('howItWorks')}</h2>
          <p className="text-2xl text-neutral-700 font-subheading">{t('howItWorksSubtitle')}</p>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-10">
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
      className="relative hover-lift"
    >
      <div className="card-premium p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-sunset opacity-10 rounded-full blur-xl"></div>
        
        <div className={`w-24 h-24 ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow-primary`}>
          <step.icon className="h-12 w-12 text-white" />
        </div>
        
        <div className="absolute top-6 left-6 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-medium">
          <span className="text-white font-ultra-bold font-heading text-lg">{index + 1}</span>
        </div>
        
        <h3 className="text-3xl font-extra-bold text-neutral-900 mb-6 font-heading">{step.title}</h3>
        <p className="text-neutral-700 text-xl font-subheading">{step.description}</p>
      </div>
    </motion.div>
  );
});

const SocialProofSection = React.memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const { t } = useLanguage();

  const stats = [
    { number: "5,000+", label: t('outfitsGenerated') },
    { number: "Amazon", label: "& Google Calendar integrated" },
    { number: "100%", label: t('satisfaction') }
  ];

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <div className="card-elegant p-12 max-w-5xl mx-auto">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="h-8 w-8 text-yellow-500 fill-current" />
              ))}
            </div>
            <blockquote className="text-3xl text-neutral-900 font-bold mb-8 font-elegant">
              "{t('testimonial')}"
            </blockquote>
            <cite className="text-neutral-700 text-xl font-subheading">— Maria S., {t('betaTester')}</cite>
          </div>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-10">
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
      className="text-center card-glass p-8 hover-elegant"
    >
      <div className="text-5xl font-ultra-bold text-primary-600 mb-4 font-display">{stat.number}</div>
      <div className="text-neutral-700 font-subheading text-lg">{stat.label}</div>
    </motion.div>
  );
});

const DemoSection = React.memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const { t } = useLanguage();

  const screens = [
    { title: t('outfitOfDay'), color: "bg-gradient-primary" },
    { title: t('wardrobeOverview'), color: "bg-gradient-secondary" },
    { title: t('aiRecommendations'), color: "bg-gradient-ocean" },
    { title: t('weatherIntegration'), color: "bg-gradient-sunset" }
  ];

  return (
    <section ref={ref} className="py-24 px-6 glass-light">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <h2 className="text-6xl font-ultra-bold text-neutral-900 mb-8 font-display">{t('seeInAction')}</h2>
          <p className="text-2xl text-neutral-700 font-subheading">{t('experienceFuture')}</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
      className="group cursor-pointer hover-lift"
    >
      <div className="card-premium p-8">
        <div className={`w-full h-56 ${screen.color} rounded-3xl mb-6 relative overflow-hidden shadow-medium`}>
          <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all duration-200"></div>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="glass-light p-4 rounded-xl">
              <div className="h-3 bg-primary-400/60 rounded mb-3"></div>
              <div className="h-3 bg-primary-400/60 rounded w-2/3"></div>
            </div>
          </div>
        </div>
        <h3 className="text-neutral-900 font-bold text-center font-heading text-lg">{screen.title}</h3>
      </div>
    </motion.div>
  );
});

const FinalCTASection = ({ navigate }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const { t } = useLanguage();

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="card-elegant p-16"
        >
          <h2 className="text-6xl font-ultra-bold text-neutral-900 mb-8 font-display">
            {t('finalCtaTitle')}
          </h2>
          <p className="text-3xl text-neutral-700 mb-12 font-subheading">
            {t('finalCtaSubtitle')}
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "var(--shadow-glow-primary)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="btn-primary text-2xl px-16 py-6"
          >
            {t('startStyling')}
            <ArrowRightIcon className="inline-block ml-4 h-7 w-7" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="py-16 px-6 glass-dark">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 logo-white-bg rounded-2xl flex items-center justify-center">
                <img 
                  src="/img/logo.png" 
                  alt="AuarAI Logo" 
                  className="h-7 w-7 object-contain"
                />
              </div>
              <span className="text-3xl font-ultra-bold font-display text-white">AuarAI</span>
            </div>
            <p className="text-gray-300 font-subheading text-lg">Your AI-powered fashion stylist</p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 font-heading text-xl text-white">Company</h4>
            <ul className="space-y-3 font-body">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-lg">{t('aboutUs')}</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-lg">{t('contact')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 font-heading text-xl text-white">Legal</h4>
            <ul className="space-y-3 font-body">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-lg">{t('privacy')}</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-lg">{t('terms')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 font-heading text-xl text-white">Connect</h4>
            <div className="flex space-x-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center hover-lift cursor-pointer">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <div className="w-12 h-12 bg-gradient-secondary rounded-2xl flex items-center justify-center hover-lift cursor-pointer">
                <EyeIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t-2 border-gray-600 pt-10 text-center">
          <p className="text-gray-300 font-subheading text-lg">
            © 2025 AuarAI. {t('allRightsReserved')}.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingPage; 