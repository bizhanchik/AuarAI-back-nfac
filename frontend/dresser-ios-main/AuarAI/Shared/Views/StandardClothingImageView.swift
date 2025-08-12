//
//  StandardClothingImageView.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI

// MARK: - Standard Clothing Image View
/// Стандартизированный компонент для отображения изображений одежды
/// с единообразным стилем во всем приложении
struct StandardClothingImageView: View {
    let imageURL: String?
    let uiImage: UIImage?
    let size: ImageSize
    let showShadow: Bool
    
    enum ImageSize {
        case small      // 100x100 - для миниатюр и редактирования
        case medium     // 200px высота - для карточек
        case large      // 300px высота - для детального просмотра
        
        var dimensions: (width: CGFloat, height: CGFloat) {
            switch self {
            case .small:
                return (100, 100)
            case .medium:
                return (180, 200)  // Фиксированная ширина и высота
            case .large:
                return (280, 300)  // Фиксированная ширина и высота
            }
        }
        
        var cornerRadius: CGFloat {
            switch self {
            case .small:
                return 12
            case .medium:
                return 12
            case .large:
                return 16
            }
        }
        
        var shadowRadius: CGFloat {
            switch self {
            case .small:
                return 2
            case .medium:
                return 4
            case .large:
                return 8
            }
        }
        
        var shadowOffset: (x: CGFloat, y: CGFloat) {
            switch self {
            case .small:
                return (0, 1)
            case .medium:
                return (0, 2)
            case .large:
                return (0, 4)
            }
        }
    }
    
    init(imageURL: String?, size: ImageSize = .medium, showShadow: Bool = true) {
        self.imageURL = imageURL
        self.uiImage = nil
        self.size = size
        self.showShadow = showShadow
    }
    
    init(uiImage: UIImage?, size: ImageSize = .small, showShadow: Bool = false) {
        self.imageURL = nil
        self.uiImage = uiImage
        self.size = size
        self.showShadow = showShadow
    }
    
    var body: some View {
        Group {
            if let uiImage = uiImage {
                // Локальное изображение
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: size.dimensions.width, height: size.dimensions.height)
                    .clipped()
                    .clipShape(RoundedRectangle(cornerRadius: size.cornerRadius))
            } else {
                // Удаленное изображение с кешированием
                CachedImageView(urlString: imageURL, aspectRatio: .fill) {
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .overlay {
                            Image(systemName: placeholderIcon)
                                .font(placeholderIconSize)
                                .foregroundColor(Color(.systemGray3))
                        }
                }
                .frame(width: size.dimensions.width, height: size.dimensions.height)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: size.cornerRadius))
            }
        }
        .shadow(
            color: showShadow ? .black.opacity(0.1) : .clear,
            radius: size.shadowRadius,
            x: size.shadowOffset.x,
            y: size.shadowOffset.y
        )
    }
    
    private var placeholderIcon: String {
        switch size {
        case .small:
            return "photo"
        case .medium:
            return "photo"
        case .large:
            return "photo"
        }
    }
    
    private var placeholderIconSize: Font {
        switch size {
        case .small:
            return .body
        case .medium:
            return .title2
        case .large:
            return .title
        }
    }
}

// MARK: - Preview
#Preview {
    VStack(spacing: 20) {
        HStack(spacing: 20) {
            StandardClothingImageView(imageURL: nil, size: .small)
            StandardClothingImageView(imageURL: nil, size: .medium)
        }
        
        StandardClothingImageView(imageURL: nil, size: .large)
    }
    .padding()
}