//
//  ImageCompressionService.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import UIKit
import SwiftUI

// MARK: - Image Compression Service
final class ImageCompressionService {
    
    // MARK: - Compression Quality Settings
    enum CompressionQuality {
        case low       // 0.3 - For thumbnails or fast uploads
        case medium    // 0.6 - Good balance of quality and size
        case high      // 0.8 - High quality with some compression
        case maximum   // 0.9 - Best quality with minimal compression
        
        var value: CGFloat {
            switch self {
            case .low: return 0.3
            case .medium: return 0.6
            case .high: return 0.8
            case .maximum: return 0.9
            }
        }
    }
    
    // MARK: - Compression Result
    struct CompressionResult {
        let compressedImage: UIImage
        let compressedData: Data
        let originalSize: Int
        let compressedSize: Int
        let compressionRatio: Double
        let quality: CompressionQuality
        
        var sizeSavedMB: Double {
            return Double(originalSize - compressedSize) / (1024 * 1024)
        }
        
        var originalSizeMB: Double {
            return Double(originalSize) / (1024 * 1024)
        }
        
        var compressedSizeMB: Double {
            return Double(compressedSize) / (1024 * 1024)
        }
    }
    
    // MARK: - Public Methods
    
    /// Compress image for clothing upload with optimal settings
    static func compressForClothingUpload(_ image: UIImage) -> CompressionResult? {
        // МАКСИМАЛЬНОЕ СЖАТИЕ ДЛЯ УСКОРЕНИЯ КЛАССИФИКАЦИИ
        return compressImage(image, quality: .low, maxDimension: 600)
    }
    
    /// Compress image with custom settings
    static func compressImage(
        _ image: UIImage,
        quality: CompressionQuality = .high,
        maxDimension: CGFloat = 1024
    ) -> CompressionResult? {
        // Resize image if needed
        let resizedImage = resizeImage(image, maxDimension: maxDimension)
        
        // Get original data for comparison
        guard let originalData = image.jpegData(compressionQuality: 1.0) else {
            return nil
        }
        
        // Compress the resized image
        guard let compressedData = resizedImage.jpegData(compressionQuality: quality.value) else {
            return nil
        }
        
        // Calculate compression ratio
        let compressionRatio = Double(compressedData.count) / Double(originalData.count)
        
        return CompressionResult(
            compressedImage: resizedImage,
            compressedData: compressedData,
            originalSize: originalData.count,
            compressedSize: compressedData.count,
            compressionRatio: compressionRatio,
            quality: quality
        )
    }
    
    /// Compress multiple images efficiently
    static func compressImages(
        _ images: [UIImage],
        quality: CompressionQuality = .high,
        maxDimension: CGFloat = 1024
    ) -> [CompressionResult] {
        return images.compactMap { image in
            compressImage(image, quality: quality, maxDimension: maxDimension)
        }
    }
    
    /// Create thumbnail from image
    static func createThumbnail(
        from image: UIImage,
        size: CGSize = CGSize(width: 150, height: 150)
    ) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }
    
    // MARK: - Private Methods
    
    private static func resizeImage(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        
        // Check if image needs resizing
        guard max(size.width, size.height) > maxDimension else {
            return image
        }
        
        // Calculate new size maintaining aspect ratio
        let aspectRatio = size.width / size.height
        let newSize: CGSize
        
        if size.width > size.height {
            newSize = CGSize(width: maxDimension, height: maxDimension / aspectRatio)
        } else {
            newSize = CGSize(width: maxDimension * aspectRatio, height: maxDimension)
        }
        
        // Create resized image
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
    
    /// Validate image before compression
    static func validateImage(_ image: UIImage) -> Bool {
        guard image.size.width > 0, image.size.height > 0 else {
            return false
        }
        
        // Check if image is too small (minimum 50x50)
        guard image.size.width >= 50, image.size.height >= 50 else {
            return false
        }
        
        // Check if image is reasonable size (max 10000x10000)
        guard image.size.width <= 10000, image.size.height <= 10000 else {
            return false
        }
        
        return true
    }
    
    /// Get image information
    static func getImageInfo(_ image: UIImage) -> [String: Any] {
        guard let data = image.jpegData(compressionQuality: 1.0) else {
            return [:]
        }
        
        return [
            "width": image.size.width,
            "height": image.size.height,
            "sizeBytes": data.count,
            "sizeMB": Double(data.count) / (1024 * 1024),
            "aspectRatio": image.size.width / image.size.height
        ]
    }
}

// MARK: - Extensions
extension UIImage {
    /// Get JPEG data with optimal compression for clothing photos
    func compressedJPEGData() -> Data? {
        return ImageCompressionService.compressForClothingUpload(self)?.compressedData
    }
    
    /// Get image size in MB
    var sizeInMB: Double {
        guard let data = self.jpegData(compressionQuality: 1.0) else { return 0 }
        return Double(data.count) / (1024 * 1024)
    }
}