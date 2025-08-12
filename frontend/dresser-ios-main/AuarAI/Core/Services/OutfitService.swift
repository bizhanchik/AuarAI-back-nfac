//
//  OutfitService.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import Foundation
import FirebaseAuth
import CoreLocation

// MARK: - Outfit Service
@MainActor
final class OutfitService: ObservableObject {
    
    // MARK: - Properties
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var currentOutfit: OutfitResponse?
    @Published var forecastOutfits: [DailyOutfitRecommendation] = []
    
    private let baseURL = "https://auarai.com/api"
    private let session = URLSession.shared
    
    // MARK: - Public Methods
    
    /// Create a single outfit suggestion based on occasion, weather, and style preference
    func createOutfit(
        occasion: OutfitOccasion,
        weather: WeatherCondition? = nil,
        stylePreference: StylePreference = .casual
    ) async throws -> OutfitResponse {
        
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        guard let url = URL(string: "\(baseURL)/stylist/suggest-outfit") else {
            throw APIError.invalidURL
        }
        
        guard let token = try await getAuthToken() else {
            throw APIError.noAuthToken
        }
        
        // Build query parameters
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "occasion", value: occasion.rawValue),
            URLQueryItem(name: "style_preference", value: stylePreference.rawValue)
        ]
        
        // Add weather information if available
        if let weather = weather {
            queryItems.append(URLQueryItem(name: "weather", value: weather.displayString))
        }
        
        components?.queryItems = queryItems
        
        guard let finalURL = components?.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: finalURL)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("🎨 Outfit creation response status: \(httpResponse.statusCode)")
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            if httpResponse.statusCode == 200 {
                let decoder = JSONDecoder()
                let outfitResponse = try decoder.decode(OutfitResponse.self, from: data)
                currentOutfit = outfitResponse
                print("✅ Successfully created outfit for \(occasion.displayName)")
                return outfitResponse
            } else {
                let errorData = String(data: data, encoding: .utf8) ?? "Unknown error"
                print("❌ Outfit creation error: \(httpResponse.statusCode) - \(errorData)")
                throw APIError.networkError("HTTP \(httpResponse.statusCode): \(errorData)")
            }
        } catch let error as DecodingError {
            print("❌ Outfit decoding error: \(error)")
            throw APIError.decodingError(error.localizedDescription)
        } catch {
            print("❌ Outfit creation network error: \(error)")
            throw APIError.networkError(error.localizedDescription)
        }
    }
    
    /// Create multiple outfit suggestions for different occasions
    func createOutfitsForOccasions(
        occasions: [OutfitOccasion],
        weather: WeatherCondition? = nil,
        stylePreference: StylePreference = .casual
    ) async throws -> [OutfitResponse] {
        
        var outfits: [OutfitResponse] = []
        
        for occasion in occasions {
            do {
                let outfit = try await createOutfit(
                    occasion: occasion,
                    weather: weather,
                    stylePreference: stylePreference
                )
                outfits.append(outfit)
            } catch {
                print("❌ Failed to create outfit for \(occasion.displayName): \(error)")
                // Continue with other occasions even if one fails
            }
        }
        
        return outfits
    }
    
    /// Get weather-based outfit forecast for multiple days
    func createForecastOutfits(
        days: Int = 5,
        occasion: OutfitOccasion = .casual,
        coordinates: CLLocationCoordinate2D? = nil
    ) async throws -> [DailyOutfitRecommendation] {
        
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        guard let url = URL(string: "\(baseURL)/stylist/forecast-outfits") else {
            throw APIError.invalidURL
        }
        
        // Use provided coordinates or default to Almaty (from web version)
        let lat = coordinates?.latitude ?? 43.2220
        let lon = coordinates?.longitude ?? 76.8512
        
        // Build query parameters
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "lat", value: String(lat)),
            URLQueryItem(name: "lon", value: String(lon)),
            URLQueryItem(name: "days", value: String(days)),
            URLQueryItem(name: "occasion", value: occasion.rawValue)
        ]
        
        guard let finalURL = components?.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: finalURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("🌤️ Forecast outfit response status: \(httpResponse.statusCode)")
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            if httpResponse.statusCode == 200 {
                let decoder = JSONDecoder()
                let forecastResponse = try decoder.decode(ForecastOutfitResponse.self, from: data)
                forecastOutfits = forecastResponse.outfitRecommendations
                print("✅ Successfully fetched \(forecastResponse.outfitRecommendations.count) forecast outfits")
                return forecastResponse.outfitRecommendations
            } else {
                let errorData = String(data: data, encoding: .utf8) ?? "Unknown error"
                print("❌ Forecast outfit error: \(httpResponse.statusCode) - \(errorData)")
                throw APIError.networkError("HTTP \(httpResponse.statusCode): \(errorData)")
            }
        } catch let error as DecodingError {
            print("❌ Forecast outfit decoding error: \(error)")
            throw APIError.decodingError(error.localizedDescription)
        } catch {
            print("❌ Forecast outfit network error: \(error)")
            throw APIError.networkError(error.localizedDescription)
        }
    }
    
    /// Get current weather condition (simplified)
    func getCurrentWeather(coordinates: CLLocationCoordinate2D? = nil) async throws -> WeatherCondition {
        guard let url = URL(string: "\(baseURL)/weather/coordinates") else {
            throw APIError.invalidURL
        }
        
        // Use provided coordinates or default to Almaty
        let lat = coordinates?.latitude ?? 43.2220
        let lon = coordinates?.longitude ?? 76.8512
        
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "lat", value: String(lat)),
            URLQueryItem(name: "lon", value: String(lon))
        ]
        
        guard let finalURL = components?.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: finalURL)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw APIError.networkError("Weather service unavailable")
            }
            
            // Parse basic weather data
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let temperature = json["temperature"] as? Double,
               let condition = json["condition"] as? String,
               let description = json["description"] as? String {
                
                return WeatherCondition(
                    temperature: temperature,
                    condition: condition,
                    humidity: json["humidity"] as? Double,
                    description: description
                )
            } else {
                throw APIError.decodingError("Invalid weather data format")
            }
        } catch {
            print("❌ Weather fetch error: \(error)")
            throw APIError.networkError(error.localizedDescription)
        }
    }
    
    /// Clear current outfit and reset state
    func clearCurrentOutfit() {
        currentOutfit = nil
        forecastOutfits = []
        errorMessage = nil
    }
    
    // MARK: - Private Methods
    
    private func getAuthToken() async throws -> String? {
        guard let currentUser = Auth.auth().currentUser else {
            throw APIError.authenticationFailed
        }
        
        do {
            return try await currentUser.getIDToken()
        } catch {
            print("❌ Failed to get Firebase token: \(error)")
            throw APIError.authenticationFailed
        }
    }
}

// MARK: - Mock Data for Development
extension OutfitService {
    /// Create a mock outfit response for development/testing
    static func mockOutfitResponse(for occasion: OutfitOccasion) -> OutfitResponse {
        let outfit = occasion == .formal ? OutfitSuggestion.mockFormal : OutfitSuggestion.mockCasual
        
        return OutfitResponse(
            outfit: outfit,
            availableItems: [
                outfit.top?.name ?? "",
                outfit.bottom?.name ?? "",
                outfit.shoes?.name ?? ""
            ].compactMap { $0.isEmpty ? nil : $0 },
            message: "Here's your perfect \(occasion.displayName.lowercased()) outfit!"
        )
    }
    
    /// Create mock forecast outfits for development/testing
    static func mockForecastOutfits() -> [DailyOutfitRecommendation] {
        let occasions = OutfitOccasion.allCases.prefix(5)
        let days = ["Today", "Tomorrow", "Wednesday", "Thursday", "Friday"]
        
        return zip(occasions, days).enumerated().map { index, data in
            let (occasion, day) = data
            let outfit = occasion == .formal ? OutfitSuggestion.mockFormal : OutfitSuggestion.mockCasual
            
            return DailyOutfitRecommendation(
                date: "2025-01-\(7 + index)",
                dateFormatted: day,
                weatherSummary: "\(15 + index * 2)°C, \(["Sunny", "Cloudy", "Partly Cloudy", "Clear", "Overcast"][index])",
                occasions: [occasion.rawValue],
                outfitTheme: "Perfect \(occasion.displayName.lowercased()) style",
                recommendations: outfit,
                weatherData: WeatherCondition(
                    temperature: Double(15 + index * 2),
                    condition: ["Sunny", "Cloudy", "Partly Cloudy", "Clear", "Overcast"][index],
                    humidity: Double(50 + index * 5),
                    description: "Perfect weather for \(occasion.displayName.lowercased()) activities"
                )
            )
        }
    }
} 