import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, TagIcon, CloudIcon, CalendarIcon, PaletteIcon, ShirtIcon } from 'lucide-react';

const ClothingDetailsModal = ({ isOpen, onClose, item, onEdit }) => {
  if (!isOpen || !item) return null;

  const formatPrice = (price) => {
    return price ? `${price.toLocaleString()} ₸` : 'Не указана';
  };

  const Tag = ({ text, colorClass, icon: Icon }) => (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${colorClass}`}>
      {Icon && <Icon className="h-4 w-4 mr-1.5 -ml-0.5" />}
      {text}
    </span>
  );

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <ShirtIcon className="h-6 w-6 text-blue-600" />
            <span>Детали одежды</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Image */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full flex items-center justify-center bg-gray-200" style={{ display: 'none' }}>
                  <div className="text-gray-400 text-center">
                    <ShirtIcon className="h-16 w-16 mx-auto mb-2" />
                    <p>Изображение недоступно</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onEdit(item)}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Редактировать
              </button>
            </div>

            {/* Right Column: Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
                {item.brand && (
                  <p className="text-lg text-gray-600 mb-2">{item.brand}</p>
                )}
                {item.category && (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {item.category}
                  </span>
                )}
              </div>

              {/* Price */}
              {item.price && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-700">
                    {formatPrice(item.price)}
                  </div>
                  <p className="text-sm text-green-600">Стоимость</p>
                </div>
              )}

              {/* Properties Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {item.color && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <PaletteIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">Цвет</span>
                    </div>
                    <p className="text-gray-900">{item.color}</p>
                  </div>
                )}

                {item.material && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <ShirtIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">Материал</span>
                    </div>
                    <p className="text-gray-900">{item.material}</p>
                  </div>
                )}

                {item.size && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-500">Размер</span>
                    </div>
                    <p className="text-gray-900">{item.size}</p>
                  </div>
                )}

                {item.gender && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-500">Гендер</span>
                    </div>
                    <p className="text-gray-900">{item.gender}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {item.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Описание</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <TagIcon className="h-5 w-5" />
                    <span>Теги</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <Tag 
                        key={index} 
                        text={tag} 
                        colorClass="bg-blue-100 text-blue-800" 
                        icon={TagIcon} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Occasions */}
              {item.occasions && item.occasions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5" />
                    <span>Поводы</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.occasions.map((occasion, index) => (
                      <Tag 
                        key={index} 
                        text={occasion} 
                        colorClass="bg-purple-100 text-purple-800" 
                        icon={CalendarIcon} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Weather Suitability */}
              {item.weather_suitability && item.weather_suitability.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <CloudIcon className="h-5 w-5" />
                    <span>Погодные условия</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.weather_suitability.map((weather, index) => (
                      <Tag 
                        key={index} 
                        text={weather} 
                        colorClass="bg-green-100 text-green-800" 
                        icon={CloudIcon} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Store Info */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Информация о покупке</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Магазин:</span>
                    <span className="text-gray-900">{item.store_name || 'Не указан'}</span>
                  </div>
                  {item.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Добавлено:</span>
                      <span className="text-gray-900">
                        {new Date(item.updated_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClothingDetailsModal; 