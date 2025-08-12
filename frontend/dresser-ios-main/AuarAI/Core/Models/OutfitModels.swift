//
//  OutfitModels.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import Foundation
import SwiftUI

// MARK: - Outfit Suggestion Models (matches backend stylist.py)
struct OutfitSuggestion: Codable, Equatable {
    let hat: ClothingItem?
    let top: ClothingItem?
    let bottom: ClothingItem?
    let shoes: ClothingItem?
    let accessories: [ClothingItem]
    let stylingTips: String
    
    enum CodingKeys: String, CodingKey {
        case hat, top, bottom, shoes, accessories
        case stylingTips = "styling_tips"
    }
}

// MARK: - Outfit Response (matches backend stylist.py)
struct OutfitResponse: Codable, Equatable {
    let outfit: OutfitSuggestion
    let availableItems: [String]
    let message: String
    
    enum CodingKeys: String, CodingKey {
        case outfit, message
        case availableItems = "available_items"
    }
}

// MARK: - Occasion Types (matches web version)
enum OutfitOccasion: String, CaseIterable {
    case casual = "casual"
    case work = "work"
    case date = "date"
    case business = "business"
    case sport = "sport"
    case formal = "formal"
    case party = "party"
    case travel = "travel"
    
    var displayName: String {
        switch self {
        case .casual: return "Casual"
        case .work: return "Work"
        case .date: return "Date"
        case .business: return "Business"
        case .sport: return "Sport"
        case .formal: return "Formal"
        case .party: return "Party"
        case .travel: return "Travel"
        }
    }
    
    var icon: String {
        switch self {
        case .casual: return "cup.and.saucer"
        case .work: return "briefcase"
        case .date: return "heart"
        case .business: return "chart.line.uptrend.xyaxis"
        case .sport: return "figure.run"
        case .formal: return "star"
        case .party: return "party.popper"
        case .travel: return "airplane"
        }
    }
    
    var color: String {
        switch self {
        case .casual: return "blue"
        case .work: return "indigo"
        case .date: return "pink"
        case .business: return "purple"
        case .sport: return "orange"
        case .formal: return "yellow"
        case .party: return "green"
        case .travel: return "cyan"
        }
    }
    
    var themeColor: Color {
        switch self {
        case .casual: return .blue
        case .work: return .indigo
        case .date: return .pink
        case .business: return .purple
        case .sport: return .orange
        case .formal: return .yellow
        case .party: return .green
        case .travel: return .cyan
        }
    }
}

// MARK: - Style Preference Types
enum StylePreference: String, CaseIterable {
    case casual = "casual"
    case elegant = "elegant"
    case edgy = "edgy"
    case minimalist = "minimalist"
    case bohemian = "bohemian"
    case classic = "classic"
    
    var displayName: String {
        switch self {
        case .casual: return "Casual"
        case .elegant: return "Elegant"
        case .edgy: return "Edgy"
        case .minimalist: return "Minimalist"
        case .bohemian: return "Bohemian"
        case .classic: return "Classic"
        }
    }
}

// MARK: - Weather Condition (simplified)
struct WeatherCondition: Codable {
    let temperature: Double
    let condition: String
    let humidity: Double?
    let description: String
    
    var displayString: String {
        return "\(Int(temperature))°C, \(condition)"
    }
}

// MARK: - Forecast Outfit Models (for multi-day outfit planning)
struct DailyOutfitRecommendation: Codable, Identifiable {
    let id = UUID()
    let date: String
    let dateFormatted: String
    let weatherSummary: String
    let occasions: [String]
    let outfitTheme: String
    let recommendations: OutfitSuggestion
    let weatherData: WeatherCondition?
    
    enum CodingKeys: String, CodingKey {
        case date, weatherSummary, occasions, recommendations
        case dateFormatted = "date_formatted"
        case outfitTheme = "outfit_theme"
        case weatherData = "weather_data"
    }
}

struct ForecastOutfitResponse: Codable {
    let status: String
    let outfitRecommendations: [DailyOutfitRecommendation]
    let message: String
    
    enum CodingKeys: String, CodingKey {
        case status, message
        case outfitRecommendations = "outfit_recommendations"
    }
}

// MARK: - Outfit Creation Request
struct OutfitCreationRequest {
    let occasions: [OutfitOccasion]
    let stylePreference: StylePreference
    let weatherCondition: WeatherCondition?
    let considerWeather: Bool
    
    init(occasions: [OutfitOccasion], 
         stylePreference: StylePreference = .casual,
         weatherCondition: WeatherCondition? = nil,
         considerWeather: Bool = true) {
        self.occasions = occasions
        self.stylePreference = stylePreference
        self.weatherCondition = weatherCondition
        self.considerWeather = considerWeather
    }
}

// MARK: - Outfit Creation State
enum OutfitCreationState: Equatable {
    case idle
    case selectingOccasions
    case selectingStyle
    case generating
    case completed
    case error(String)
    
    static func == (lhs: OutfitCreationState, rhs: OutfitCreationState) -> Bool {
        switch (lhs, rhs) {
        case (.idle, .idle),
             (.selectingOccasions, .selectingOccasions),
             (.selectingStyle, .selectingStyle),
             (.generating, .generating),
             (.completed, .completed):
            return true
        case (.error(let lhsMessage), .error(let rhsMessage)):
            return lhsMessage == rhsMessage
        default:
            return false
        }
    }
}

// MARK: - Helper Extensions
extension OutfitSuggestion {
    var allItems: [ClothingItem] {
        var items: [ClothingItem] = []
        if let hat = hat { items.append(hat) }
        if let top = top { items.append(top) }
        if let bottom = bottom { items.append(bottom) }
        if let shoes = shoes { items.append(shoes) }
        items.append(contentsOf: accessories)
        return items
    }
    
    var isComplete: Bool {
        return top != nil && bottom != nil && shoes != nil
    }
    
    var categoryCount: Int {
        var count = 0
        if hat != nil { count += 1 }
        if top != nil { count += 1 }
        if bottom != nil { count += 1 }
        if shoes != nil { count += 1 }
        count += accessories.count
        return count
    }
}

// MARK: - Mock Data for Previews
extension OutfitSuggestion {
    static var mockCasual: OutfitSuggestion {
        OutfitSuggestion(
            hat: nil,
            top: ClothingItem(
                id: 1,
                name: "Blue Cotton T-Shirt",
                category: "Top",
                color: "Blue",
                imageURL: "https://example.com/blue-tshirt.jpg"
            ),
            bottom: ClothingItem(
                id: 2,
                name: "Dark Jeans",
                category: "Bottom",
                color: "Dark Blue",
                imageURL: "https://example.com/dark-jeans.jpg"
            ),
            shoes: ClothingItem(
                id: 3,
                name: "White Sneakers",
                category: "Shoes",
                color: "White",
                imageURL: "https://example.com/white-sneakers.jpg"
            ),
            accessories: [],
            stylingTips: "Perfect casual look for everyday wear. The blue t-shirt pairs well with dark jeans and white sneakers for a clean, comfortable style."
        )
    }
    
    static var mockFormal: OutfitSuggestion {
        OutfitSuggestion(
            hat: nil,
            top: ClothingItem(
                id: 4,
                name: "White Dress Shirt",
                category: "Top",
                color: "White",
                imageURL: "https://example.com/white-shirt.jpg"
            ),
            bottom: ClothingItem(
                id: 5,
                name: "Black Dress Pants",
                category: "Bottom",
                color: "Black",
                imageURL: "https://example.com/black-pants.jpg"
            ),
            shoes: ClothingItem(
                id: 6,
                name: "Black Leather Shoes",
                category: "Shoes",
                color: "Black",
                imageURL: "https://example.com/black-shoes.jpg"
            ),
            accessories: [
                ClothingItem(
                    id: 7,
                    name: "Black Leather Belt",
                    category: "Accessories",
                    color: "Black",
                    imageURL: "https://example.com/black-belt.jpg"
                )
            ],
            stylingTips: "Classic formal outfit perfect for business meetings or formal events. The white shirt and black pants combination is timeless and professional."
        )
    }
}