//
//  ClothingItem.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import Foundation

// MARK: - Clothing Item Model (matches backend schemas.py exactly)
struct ClothingItem: Identifiable, Codable, Equatable {
    let id: Int
    let name: String
    let brand: String?
    let category: String?
    let gender: String?
    let color: String?
    let size: String?
    let material: String?
    let description: String?
    let imageURL: String?
    let storeName: String
    let storeURL: String?
    let productURL: String?
    let price: Double?
    let tags: [String]
    let occasions: [String]
    let weatherSuitability: [String]
    let ownerID: Int
    let available: Bool?
    let updatedAt: String?
    let aiGeneratedEmbedding: [Double]?
    
    enum CodingKeys: String, CodingKey {
        case id, name, brand, category, gender, color, size, material, description, price, tags, occasions, available
        case imageURL = "image_url"
        case storeName = "store_name"
        case storeURL = "store_url"
        case productURL = "product_url"
        case weatherSuitability = "weather_suitability"
        case ownerID = "owner_id"
        case updatedAt = "updated_at"
        case aiGeneratedEmbedding = "ai_generated_embedding"
    }
    
    init(
        id: Int = 0,
        name: String,
        brand: String? = nil,
        category: String? = nil,
        gender: String? = nil,
        color: String? = nil,
        size: String? = nil,
        material: String? = nil,
        description: String? = nil,
        imageURL: String? = nil,
        storeName: String = "User Upload",
        storeURL: String? = nil,
        productURL: String? = nil,
        price: Double? = 0.0,
        tags: [String] = [],
        occasions: [String] = [],
        weatherSuitability: [String] = [],
        ownerID: Int = 0,
        available: Bool? = true,
        updatedAt: String? = nil,
        aiGeneratedEmbedding: [Double]? = nil
    ) {
        self.id = id
        self.name = name
        self.brand = brand
        self.category = category
        self.gender = gender
        self.color = color
        self.size = size
        self.material = material
        self.description = description
        self.imageURL = imageURL
        self.storeName = storeName
        self.storeURL = storeURL
        self.productURL = productURL
        self.price = price
        self.tags = tags
        self.occasions = occasions
        self.weatherSuitability = weatherSuitability
        self.ownerID = ownerID
        self.available = available
        self.updatedAt = updatedAt
        self.aiGeneratedEmbedding = aiGeneratedEmbedding
    }
}

// MARK: - Clothing Item Create (for sending to backend)
struct ClothingItemCreate: Codable {
    let name: String
    let brand: String?
    let category: String?
    let gender: String?
    let color: String?
    let size: String?
    let material: String?
    let description: String?
    let imageURL: String?
    let storeName: String
    let storeURL: String?
    let productURL: String?
    let price: Double?
    let tags: [String]
    let occasions: [String]
    let weatherSuitability: [String]
    let aiGeneratedEmbedding: [Double]?
    
    enum CodingKeys: String, CodingKey {
        case name, brand, category, gender, color, size, material, description, price, tags, occasions
        case imageURL = "image_url"
        case storeName = "store_name"
        case storeURL = "store_url"
        case productURL = "product_url"
        case weatherSuitability = "weather_suitability"
        case aiGeneratedEmbedding = "ai_generated_embedding"
    }
}

// MARK: - Classification Response Model (matches backend exactly)
struct ClassificationResponse: Codable {
    let clothingType: String
    let color: String
    let material: String?
    let pattern: String?
    let brand: String?
    let confidenceScore: Double
    let description: String?
    let predictedTags: [String]
    let occasions: [String]
    let weatherSuitability: [String]
    let predictedName: String?
    let predictedCategory: String?
    let predictedColor: String?
    let predictedBrand: String?
    let predictedMaterial: String?
    let additionalDetails: [String: String?]?
    
    enum CodingKeys: String, CodingKey {
        case clothingType = "clothing_type"
        case color, material, pattern, brand, description, occasions
        case confidenceScore = "confidence_score"
        case predictedTags = "predicted_tags"
        case weatherSuitability = "weather_suitability"
        case predictedName = "predicted_name"
        case predictedCategory = "predicted_category"
        case predictedColor = "predicted_color"
        case predictedBrand = "predicted_brand"
        case predictedMaterial = "predicted_material"
        case additionalDetails = "additional_details"
    }
}

// MARK: - Upload Response Model (matches backend exactly)
struct UploadResponse: Codable {
    let url: String
    let message: String
    let filename: String?
    let originalSizeMB: Double?
    let compressedSizeMB: Double?
    let compressionRatio: Double?
    let classification: ClassificationResponse?
    
    enum CodingKeys: String, CodingKey {
        case url, message, filename, classification
        case originalSizeMB = "original_size_mb"
        case compressedSizeMB = "compressed_size_mb"
        case compressionRatio = "compression_ratio"
    }
}

// MARK: - Helper Extensions
extension ClothingItem {
    func toCreateRequest() -> ClothingItemCreate {
        return ClothingItemCreate(
            name: name,
            brand: brand,
            category: category,
            gender: gender,
            color: color,
            size: size,
            material: material,
            description: description,
            imageURL: imageURL,
            storeName: storeName,
            storeURL: storeURL,
            productURL: productURL,
            price: price,
            tags: tags,
            occasions: occasions,
            weatherSuitability: weatherSuitability,
            aiGeneratedEmbedding: aiGeneratedEmbedding
        )
    }
}

// MARK: - Wardrobe Compatibility Models
struct WardrobeCompatibilityResult: Codable {
    let compatibility_percentage: Double
    let matching_items: Int
    let total_items: Int
    let recommendations: [String]
    let color_matches: [String]
    let style_matches: [String]
    let missing_essentials: [String]
}

struct WardrobeCompatibilityResponse: Codable {
    let success: Bool
    let message: String
    let result: WardrobeCompatibilityResult?
}

extension ClassificationResponse {
    func toClothingItemCreate(imageURL: String) -> ClothingItemCreate {
        return ClothingItemCreate(
            name: predictedName ?? clothingType,
            brand: predictedBrand ?? brand,
            category: predictedCategory ?? clothingType,
            gender: additionalDetails?["gender"] ?? nil,
            color: predictedColor ?? color,
            size: additionalDetails?["size"] ?? nil,
            material: predictedMaterial ?? material,
            description: description,
            imageURL: imageURL,
            storeName: "User Upload",
            storeURL: nil,
            productURL: nil,
            price: 0.0,
            tags: predictedTags,
            occasions: occasions,
            weatherSuitability: weatherSuitability,
            aiGeneratedEmbedding: nil
        )
    }
}