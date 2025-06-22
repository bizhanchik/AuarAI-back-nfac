import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EditIcon, 
  ExternalLinkIcon, 
  TagIcon, 
  CloudIcon, 
  HeartIcon,
  StarIcon,
  SparklesIcon,
  EyeIcon,
  ShirtIcon,
  ImageIcon,
  ZapIcon,
  TrendingUpIcon
} from 'lucide-react';

const ClothingItem = ({ item, onViewDetails, onEditItem, index }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    onEditItem(item);
  };

  const handleCardClick = () => {
    onViewDetails(item);
  };

  const Tag = ({ text, colorClass, icon: Icon }) => (
    <span 
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${colorClass}`}
    >
      {Icon && <Icon className="h-3 w-3 mr-1.5 -ml-0.5" />}
      {text}
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: "easeOut"
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group cursor-pointer"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Premium Card Container */}
        <div className="card-premium p-6 h-full overflow-hidden transition-shadow duration-300 group-hover:shadow-xl">
          {/* Image Section */}
          <div className="relative aspect-square mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
            {!imageError ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
                onClick={handleImageClick}
              />
            ) : (
              <div 
                className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-400 transition-transform duration-300 hover:scale-105"
                onClick={handleImageClick}
              >
                <ImageIcon className="w-16 h-16 mb-3" />
                <p className="text-sm font-medium">Изображение недоступно</p>
              </div>
            )}
            
            {/* Floating Action Buttons */}
            <div className={`absolute top-4 right-4 flex space-x-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(item);
                }}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
              >
                <EyeIcon className="h-4 w-4 text-blue-600" />
              </button>
              
              <button
                onClick={handleImageClick}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
              >
                <EditIcon className="h-4 w-4 text-purple-600" />
              </button>
            </div>

            {/* Category Badge */}
            {item.category && (
              <div className="absolute top-4 left-4">
                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/20">
                  {item.category}
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="space-y-4">
            {/* Title and Brand */}
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-1 transition-colors duration-300 group-hover:text-purple-600">
                {item.name}
              </h3>
              {item.brand && (
                <p className="text-sm font-medium text-slate-500 flex items-center">
                  <SparklesIcon className="h-3 w-3 mr-1 text-purple-400" />
                  {item.brand}
                </p>
              )}
            </div>

            {/* Tags Section */}
            <div className="flex flex-wrap gap-2">
              {(item.tags || []).slice(0, 2).map((tag) => (
                <Tag 
                  key={tag}
                  text={tag} 
                  colorClass="bg-blue-100/80 text-blue-700 border border-blue-200/50" 
                  icon={TagIcon}
                />
              ))}
              
              {(item.weather_suitability || []).slice(0, 1).map((weather) => (
                <Tag 
                  key={weather}
                  text={weather} 
                  colorClass="bg-purple-100/80 text-purple-700 border border-purple-200/50" 
                  icon={CloudIcon}
                />
              ))}
              
              {(item.tags?.length || 0) > 2 && (
                <Tag 
                  text={`+${(item.tags.length || 0) - 2}`} 
                  colorClass="bg-slate-100/80 text-slate-600 border border-slate-200/50" 
                  icon={ZapIcon}
                />
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <HeartIcon className="h-3 w-3 text-red-400" />
                  <span>Любимое</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <TrendingUpIcon className="h-3 w-3 text-green-400" />
                  <span>Популярно</span>
                </div>
              </div>
              
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-transform duration-200 hover:scale-110">
                <StarIcon className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ onAddClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="col-span-full flex flex-col items-center justify-center py-20"
  >
    <div className="card-glass p-12 text-center max-w-lg mx-auto">
      <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl mb-8">
        <ShirtIcon className="h-12 w-12 text-white" />
      </div>
      
      <h3 className="text-3xl font-black text-white mb-4 font-display">
        Создайте свой стильный гардероб
      </h3>
      
      <p className="text-gray-300 mb-8 text-lg leading-relaxed">
        Добавьте свою первую вещь и позвольте ИИ создать для вас персональные рекомендации стиля
      </p>
      
      <button
        onClick={onAddClick}
        className="btn-primary text-lg px-8 py-4 transition-transform duration-200 hover:scale-105"
      >
        <SparklesIcon className="h-5 w-5 mr-2" />
        Добавить первую вещь
      </button>
    </div>
  </motion.div>
);

const ClothingGrid = ({ items, onViewDetails, onEditItem, onAddClick }) => {
  if (!items || items.length === 0) {
    return <EmptyState onAddClick={onAddClick} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {items.map((item, index) => (
        <ClothingItem 
          key={item.id} 
          item={item} 
          index={index}
          onViewDetails={onViewDetails}
          onEditItem={onEditItem}
        />
      ))}
    </div>
  );
};

export default ClothingGrid; 