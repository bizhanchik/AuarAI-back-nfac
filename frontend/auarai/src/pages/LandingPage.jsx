import { motion } from 'framer-motion';
import { ChevronRightIcon, HeartIcon, CloudIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const handleTryNow = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/30 to-pink-50/20 font-body">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-violet/5 via-transparent to-brand-peach/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo Placeholder */}
            <motion.div 
              className="mx-auto w-32 h-32 bg-gradient-to-br from-brand-violet to-brand-peach rounded-3xl flex items-center justify-center mb-8 shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-white font-display text-2xl">AI</span>
            </motion.div>

            <motion.h1 
              className="font-display text-5xl md:text-7xl text-neutral-800 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              AuarAI
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-neutral-600 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Your smart stylist. Fashion that fits you.
            </motion.p>

            <motion.button
              onClick={handleTryNow}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-brand-violet to-brand-peach text-white font-medium text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Try It Now
              <ChevronRightIcon className="ml-2 h-5 w-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="font-display text-4xl md:text-5xl text-neutral-800 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Three simple steps to revolutionize your wardrobe choices
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                step: "01",
                title: "Upload Wardrobe",
                description: "Simply photograph your clothes and let our AI catalog your personal style collection.",
                icon: "📸",
                color: "from-brand-violet/20 to-brand-violet/10"
              },
              {
                step: "02", 
                title: "Set Your Plans",
                description: "Tell us about your day, the weather, and your mood. We'll understand the context.",
                icon: "🌤️",
                color: "from-brand-peach/20 to-brand-peach/10"
              },
              {
                step: "03",
                title: "Get Styled",
                description: "Receive personalized outfit recommendations that perfectly match your style and occasion.",
                icon: "✨",
                color: "from-brand-emerald/20 to-brand-emerald/10"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="relative"
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={`bg-gradient-to-br ${item.color} p-8 rounded-3xl shadow-sm border border-white/50 h-full`}>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="text-sm font-medium text-brand-violet mb-2">STEP {item.step}</div>
                  <h3 className="font-display text-2xl text-neutral-800 mb-4">{item.title}</h3>
                  <p className="text-neutral-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Personalization Block */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="font-display text-4xl md:text-5xl text-neutral-800 mb-4">
              Tailored to Your Style
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Our AI understands your unique preferences and adapts to every occasion
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="font-display text-3xl text-neutral-800 mb-6">Choose Your Vibe</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Romantic", icon: HeartIcon, active: true },
                  { label: "Minimalist", icon: SparklesIcon, active: false },
                  { label: "Cold Weather", icon: CloudIcon, active: true },
                  { label: "Professional", icon: SparklesIcon, active: false },
                  { label: "Casual", icon: HeartIcon, active: true },
                  { label: "Evening", icon: SparklesIcon, active: false }
                ].map((mood, index) => {
                  const IconComponent = mood.icon;
                  return (
                    <motion.div
                      key={index}
                      className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
                        mood.active 
                          ? 'border-brand-violet bg-brand-violet/10 text-brand-violet' 
                          : 'border-neutral-200 bg-white/50 text-neutral-500'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{mood.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div 
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {[1, 2, 3, 4].map((item) => (
                <motion.div
                  key={item}
                  className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl shadow-sm border border-white/50 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-violet/20 to-brand-peach/20 rounded-full mx-auto mb-2"></div>
                    <span className="text-sm text-neutral-600">Outfit {item}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Outfit Gallery */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="font-display text-4xl md:text-5xl text-neutral-800 mb-4">
              Style Inspiration
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Discover looks crafted for real occasions and real weather
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { title: "Date Night in Paris", weather: "18°C, Clear", color: "from-pink-100 to-purple-100" },
              { title: "Walk in Almaty", weather: "-5°C, Snowy", color: "from-blue-100 to-cyan-100" },
              { title: "Business Meeting", weather: "22°C, Partly Cloudy", color: "from-gray-100 to-slate-100" },
              { title: "Weekend Brunch", weather: "25°C, Sunny", color: "from-yellow-100 to-orange-100" },
              { title: "Art Gallery Opening", weather: "20°C, Light Rain", color: "from-indigo-100 to-purple-100" },
              { title: "Coffee with Friends", weather: "16°C, Overcast", color: "from-emerald-100 to-teal-100" }
            ].map((look, index) => (
              <motion.div
                key={index}
                className={`bg-gradient-to-br ${look.color} p-6 rounded-3xl shadow-sm border border-white/50 aspect-square flex flex-col justify-between`}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/60 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-display text-xl text-neutral-800 mb-1">{look.title}</h3>
                  <p className="text-sm text-neutral-600">{look.weather}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="text-center"
            {...fadeInUp}
          >
            <button className="inline-flex items-center px-6 py-3 border-2 border-brand-violet text-brand-violet font-medium rounded-2xl hover:bg-brand-violet hover:text-white transition-all duration-300">
              See More Looks
              <ChevronRightIcon className="ml-2 h-5 w-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-violet/10 via-brand-peach/5 to-brand-emerald/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-display text-4xl md:text-5xl text-neutral-800 mb-6">
              Ready to Transform Your Style?
            </h2>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              Join thousands of fashion-forward individuals who trust AuarAI for their daily styling needs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <motion.button
                onClick={handleTryNow}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-brand-violet to-brand-peach text-white font-medium text-lg rounded-2xl shadow-lg"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Early Access
                <ChevronRightIcon className="ml-2 h-5 w-5" />
              </motion.button>
              
              <motion.button
                className="inline-flex items-center px-8 py-4 border-2 border-neutral-300 text-neutral-700 font-medium text-lg rounded-2xl hover:border-brand-violet hover:text-brand-violet transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Try AuarAI in Telegram
                <ChevronRightIcon className="ml-2 h-5 w-5" />
              </motion.button>
            </div>

            <div className="flex justify-center space-x-6">
              <motion.div 
                className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
              >
                <span className="text-2xl">📱</span>
              </motion.div>
              <motion.div 
                className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
              >
                <span className="text-2xl">📸</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 