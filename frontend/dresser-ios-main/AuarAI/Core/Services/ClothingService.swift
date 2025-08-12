//
//  ClothingService.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import Foundation
import UIKit
import FirebaseAuth

// MARK: - API Errors
enum APIError: LocalizedError {
    case invalidURL
    case noAuthToken
    case uploadFailed(String)
    case classificationFailed(String)
    case networkError(String)
    case decodingError(String)
    case invalidResponse
    case authenticationFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case .noAuthToken:
            return "No authentication token available"
        case .uploadFailed(let message):
            return "Upload failed: \(message)"
        case .classificationFailed(let message):
            return "Classification failed: \(message)"
        case .networkError(let message):
            return "Network error: \(message)"
        case .decodingError(let message):
            return "Data decoding error: \(message)"
        case .invalidResponse:
            return "Invalid server response"
        case .authenticationFailed:
            return "Authentication failed"
        }
    }
}

// MARK: - Clothing Service
@MainActor
final class ClothingService: ObservableObject {
    
    // MARK: - Properties
    @Published var clothingItems: [ClothingItem] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let baseURL = "https://auarai.com/api"
    private let session = URLSession.shared
    
    // MARK: - Public Methods
    
    /// Fetch user's clothing items from backend
    func fetchClothingItems() async throws {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        guard let url = URL(string: "\(baseURL)/items/") else {
            throw APIError.invalidURL
        }
        
        guard let token = try await getAuthToken() else {
            throw APIError.noAuthToken
        }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("🔍 Response status: \(httpResponse.statusCode)")
                print("🔍 Response headers: \(httpResponse.allHeaderFields)")
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            if httpResponse.statusCode == 200 {
                let decoder = JSONDecoder()
                let items = try decoder.decode([ClothingItem].self, from: data)
                clothingItems = items
                print("✅ Successfully fetched \(items.count) clothing items")
            } else {
                let errorData = String(data: data, encoding: .utf8) ?? "Unknown error"
                print("❌ API Error: \(httpResponse.statusCode) - \(errorData)")
                throw APIError.networkError("HTTP \(httpResponse.statusCode): \(errorData)")
            }
        } catch let error as DecodingError {
            print("❌ Decoding error: \(error)")
            throw APIError.decodingError(error.localizedDescription)
        } catch {
            print("❌ Network error: \(error)")
            throw APIError.networkError(error.localizedDescription)
        }
    }
    
    /// Upload and classify a single image
    func uploadAndClassifyImage(_ image: UIImage) async throws -> UploadResponse {
        guard let url = URL(string: "\(baseURL)/upload-and-classify") else {
            throw APIError.invalidURL
        }
        
        guard let token = try await getAuthToken() else {
            throw APIError.noAuthToken
        }
        
        // Validate image before compression
        guard ImageCompressionService.validateImage(image) else {
            throw APIError.uploadFailed("Invalid image format or size")
        }
        
        // Compress image for upload
        guard let compressionResult = ImageCompressionService.compressForClothingUpload(image) else {
            throw APIError.uploadFailed("Failed to compress image")
        }
        
        let imageData = compressionResult.compressedData
        
        print("📊 Image compression stats:")
        print("   Original: \(String(format: "%.2f", compressionResult.originalSizeMB)) MB")
        print("   Compressed: \(String(format: "%.2f", compressionResult.compressedSizeMB)) MB")
        print("   Saved: \(String(format: "%.2f", compressionResult.sizeSavedMB)) MB (\(Int((1 - compressionResult.compressionRatio) * 100))%)")
        
        // Create multipart form data
        let boundary = UUID().uuidString
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add image file
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        do {
            let (data, response) = try await session.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("🔍 Upload response status: \(httpResponse.statusCode)")
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            if httpResponse.statusCode == 200 {
                // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ОТВЕТА БЭКЭНДА
                let responseString = String(data: data, encoding: .utf8) ?? "Unable to decode response"
                print("🔍 RAW BACKEND RESPONSE:")
                print(responseString)
                print("🔍 Response size: \(data.count) bytes")
                
                let decoder = JSONDecoder()
                do {
                    let uploadResponse = try decoder.decode(UploadResponse.self, from: data)
                    print("✅ Successfully uploaded and classified image")
                    return uploadResponse
                } catch let decodingError {
                    print("❌ DECODING ERROR DETAILS:")
                    print("Error: \(decodingError)")
                    if let decodingError = decodingError as? DecodingError {
                        switch decodingError {
                        case .keyNotFound(let key, let context):
                            print("Key '\(key.stringValue)' not found: \(context.debugDescription)")
                        case .typeMismatch(let type, let context):
                            print("Type mismatch for type '\(type)': \(context.debugDescription)")
                        case .valueNotFound(let type, let context):
                            print("Value not found for type '\(type)': \(context.debugDescription)")
                        case .dataCorrupted(let context):
                            print("Data corrupted: \(context.debugDescription)")
                        @unknown default:
                            print("Unknown decoding error")
                        }
                    }
                    throw APIError.decodingError("Failed to decode response: \(decodingError.localizedDescription)")
                }
            } else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                print("❌ Upload error: \(httpResponse.statusCode) - \(errorMessage)")
                throw APIError.uploadFailed("HTTP \(httpResponse.statusCode): \(errorMessage)")
            }
        } catch let error as DecodingError {
            print("❌ Upload decoding error: \(error)")
            throw APIError.decodingError(error.localizedDescription)
        } catch {
            print("❌ Upload network error: \(error)")
            throw APIError.networkError(error.localizedDescription)
        }
    }
    
    /// Upload and classify multiple images (up to 10)
    func uploadAndClassifyImages(_ images: [UIImage]) async throws -> [UploadResponse] {
        isLoading = true
        defer { isLoading = false }
        
        guard images.count <= 10 else {
            throw APIError.uploadFailed("Maximum 10 images allowed")
        }
        
        var results: [UploadResponse] = []
        
        // Process images one by one for better error handling
        for (index, image) in images.enumerated() {
            do {
                let result = try await uploadAndClassifyImage(image)
                results.append(result)
                print("✅ Processed image \(index + 1)/\(images.count)")
            } catch {
                print("❌ Failed to process image \(index + 1): \(error.localizedDescription)")
                throw error
            }
        }
        
        return results
    }
    
    /// Add clothing item to user's wardrobe
    func addClothingItem(_ itemCreate: ClothingItemCreate) async throws -> ClothingItem {
        guard let url = URL(string: "\(baseURL)/clothing/") else {
            throw APIError.invalidURL
        }
        
        guard let token = try await getAuthToken() else {
            throw APIError.noAuthToken
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let encoder = JSONEncoder()
            let jsonData = try encoder.encode(itemCreate)
            request.httpBody = jsonData
            
            let (data, response) = try await session.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("🔍 Add item response status: \(httpResponse.statusCode)")
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                let decoder = JSONDecoder()
                let newItem = try decoder.decode(ClothingItem.self, from: data)
                
                // Add to local collection
                clothingItems.append(newItem)
                print("✅ Successfully added clothing item to wardrobe")
                
                return newItem
            } else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                print("❌ Add item error: \(httpResponse.statusCode) - \(errorMessage)")
                throw APIError.uploadFailed("HTTP \(httpResponse.statusCode): \(errorMessage)")
            }
        } catch let error as DecodingError {
            print("❌ Add item decoding error: \(error)")
            throw APIError.decodingError(error.localizedDescription)
        } catch {
            print("❌ Add item network error: \(error)")
            throw APIError.networkError(error.localizedDescription)
        }
    }
    
    /// Delete clothing item from wardrobe
    func deleteClothingItem(_ itemId: Int) async throws {
        guard let url = URL(string: "\(baseURL)/clothing/\(itemId)") else {
            throw APIError.invalidURL
        }
        
        guard let token = try await getAuthToken() else {
            throw APIError.noAuthToken
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            if httpResponse.statusCode == 200 || httpResponse.statusCode == 204 {
                // Remove from local collection
                clothingItems.removeAll { $0.id == itemId }
                print("✅ Successfully deleted clothing item")
            } else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                print("❌ Delete error: \(httpResponse.statusCode) - \(errorMessage)")
                throw APIError.networkError("HTTP \(httpResponse.statusCode): \(errorMessage)")
            }
        } catch {
            print("❌ Delete network error: \(error)")
            throw APIError.networkError(error.localizedDescription)
        }
    }
    
    /// Analyze wardrobe compatibility with body analysis
    func analyzeWardrobeCompatibility() async throws -> WardrobeCompatibilityResult {
        guard let url = URL(string: "\(baseURL)/body-analysis/wardrobe-compatibility") else {
            throw APIError.invalidURL
        }
        
        guard let token = try await getAuthToken() else {
            throw APIError.noAuthToken
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            if httpResponse.statusCode == 200 {
                let decoder = JSONDecoder()
                let compatibilityResponse = try decoder.decode(WardrobeCompatibilityResponse.self, from: data)
                
                if let result = compatibilityResponse.result {
                    print("✅ Successfully analyzed wardrobe compatibility: \(result.compatibility_percentage)%")
                    return result
                } else {
                    throw APIError.decodingError("No compatibility result in response")
                }
            } else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                print("❌ Compatibility analysis error: \(httpResponse.statusCode) - \(errorMessage)")
                throw APIError.networkError("HTTP \(httpResponse.statusCode): \(errorMessage)")
            }
        } catch let error as DecodingError {
            print("❌ Compatibility analysis decoding error: \(error)")
            throw APIError.decodingError(error.localizedDescription)
        } catch {
            print("❌ Compatibility analysis network error: \(error)")
            throw APIError.networkError(error.localizedDescription)
        }
    }
    
    // MARK: - Private Methods
    
    private func getAuthToken() async throws -> String? {
        guard let user = Auth.auth().currentUser else {
            throw APIError.noAuthToken
        }
        
        do {
            let token = try await user.getIDToken()
            return token
        } catch {
            print("❌ Failed to get Firebase token: \(error)")
            throw APIError.authenticationFailed
        }
    }
}