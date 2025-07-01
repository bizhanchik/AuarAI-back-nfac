import { useState } from 'react';
import { motion } from 'framer-motion';
import { LoaderIcon, ClockIcon } from 'lucide-react';

const SkeletonClothingItem = ({ previewData, index }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: "easeOut"
      }}
      className="group cursor-default"
    >
      <div className="relative">
        {/* Processing Card Container */}
        <div className="card-premium p-3 sm:p-4 md:p-6 overflow-hidden transition-all duration-150 flex flex-col h-[420px] sm:h-[480px] md:h-[520px] bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/50">
          
          {/* Image Section with Processing Overlay */}
          <div className="relative h-[200px] sm:h-[240px] md:h-[280px] mb-3 sm:mb-4 md:mb-6 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0">
            {!imageError && previewData.preview ? (
              <img
                src={previewData.preview}
                alt={previewData.name}
                className="w-full h-full object-cover opacity-60"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                <LoaderIcon className="w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-3 text-blue-500 animate-spin" />
                <p className="text-xs sm:text-sm font-medium text-center px-2 text-slate-600">Processing...</p>
              </div>
            )}
            
            {/* Processing Overlay */}
            <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                <LoaderIcon className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            </div>

            {/* Processing Badge */}
            <div className="absolute top-2 left-2">
              <div className="px-2 py-1 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/20 flex items-center space-x-1">
                <ClockIcon className="h-3 w-3" />
                <span>Processing</span>
              </div>
            </div>
          </div>

          {/* Content Section with Skeleton */}
          <div className="flex flex-col flex-1 justify-between min-h-0">
            <div className="space-y-2">
              {/* Title Skeleton */}
              <div>
                <div className="h-4 sm:h-5 bg-gradient-to-r from-slate-200 to-slate-300 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded animate-pulse w-3/4"></div>
              </div>

              {/* Tags Skeleton */}
              <div className="flex flex-wrap gap-1">
                <div className="h-6 w-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full animate-pulse"></div>
                <div className="h-6 w-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Bottom Section Skeleton */}
            <div className="space-y-2">
              <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded animate-pulse w-1/2"></div>
              <div className="flex space-x-1">
                <div className="h-7 w-7 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full animate-pulse"></div>
                <div className="h-7 w-7 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Pulsing Animation */}
        <motion.div
          className="absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-blue-400/50"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </motion.div>
  );
};

export default SkeletonClothingItem; 