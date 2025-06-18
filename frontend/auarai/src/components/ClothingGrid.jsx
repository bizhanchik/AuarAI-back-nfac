import { useState } from 'react';
import { EditIcon, ExternalLinkIcon, TagIcon, CloudIcon } from 'lucide-react';

const ClothingItem = ({ item }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const Tag = ({ text, colorClass, icon: Icon }) => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {Icon && <Icon className="h-3.5 w-3.5 mr-1.5 -ml-0.5" />}
      {text}
    </span>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <div className="aspect-w-1 aspect-h-1 bg-gray-100 relative">
        {!imageError ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-gray-400">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Overlay with edit button */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <button className="p-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-90 group-hover:scale-100">
              <EditIcon className="h-5 w-5 text-gray-700" />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {item.category && (
            <p className="text-sm font-medium text-blue-600 mb-1">{item.category}</p>
        )}
        <h3 className="text-lg font-bold text-gray-900 truncate">
          {item.name}
        </h3>
        {item.brand && (
          <p className="text-sm text-gray-500 mt-1">
            {item.brand}
          </p>
        )}

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(item.tags || []).slice(0, 2).map((tag) => (
            <Tag key={tag} text={tag} colorClass="bg-blue-100 text-blue-800" icon={TagIcon} />
          ))}
          {(item.weather_suitability || []).slice(0, 1).map((weather) => (
             <Tag key={weather} text={weather} colorClass="bg-purple-100 text-purple-800" icon={CloudIcon} />
          ))}
          {(item.tags?.length || 0) > 2 && (
            <Tag text={`+${(item.tags.length || 0) - 2}`} colorClass="bg-gray-200 text-gray-700" />
          )}
        </div>
      </div>
    </div>
  );
};

const ClothingGrid = ({ items, onRefresh }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {items.map((item) => (
        <ClothingItem key={item.id} item={item} />
      ))}
    </div>
  );
};

export default ClothingGrid; 