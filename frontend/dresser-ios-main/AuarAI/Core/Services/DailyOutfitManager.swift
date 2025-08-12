//
//  DailyOutfitManager.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import Foundation
import SwiftUI
import CoreLocation

// MARK: - Daily Outfit Data Model
struct DailyOutfitData: Codable {
    let outfit: OutfitResponse
    let createdAt: Date
    let expiresAt: Date
    
    var isExpired: Bool {
        Date() > expiresAt
    }
}

// MARK: - Daily Outfit Manager
@MainActor
final class DailyOutfitManager: ObservableObject {
    
    // MARK: - Shared Instance
    static let shared = DailyOutfitManager()
    
    // MARK: - Properties
    @Published var currentDailyOutfit: DailyOutfitData?
    @Published var isGenerating = false
    
    private let outfitService = OutfitService()
    private let locationManager = LocationManager()
    private let userDefaults = UserDefaults.standard
    private let dailyOutfitKey = "daily_outfit_data"
    
    // MARK: - Initialization
    private init() {
        loadStoredOutfit()
    }
    
    // MARK: - Public Methods
    
    /// Check if we need a new outfit and generate one if necessary
    func checkAndGenerateOutfitIfNeeded() async {
        // Check if current outfit is expired or doesn't exist
        if currentDailyOutfit?.isExpired != false {
            await generateNewDailyOutfit()
        }
    }
    
    /// Force generate a new daily outfit
    func generateNewDailyOutfit() async {
        isGenerating = true
        defer { isGenerating = false }
        
        do {
            // Request location permission if needed
            await locationManager.requestLocationPermission()
            
            // Get current location or use default coordinates
            let coordinates = locationManager.getCoordinates()
            
            // Get current weather for better outfit suggestions
            let weather = try? await outfitService.getCurrentWeather(coordinates: coordinates)
            
            // Generate outfit for casual/daily occasion
            let outfit = try await outfitService.createOutfit(
                occasion: .casual,
                weather: weather,
                stylePreference: .casual
            )
            
            // Create daily outfit data with 12-hour expiration
            let now = Date()
            let expirationDate = Calendar.current.date(byAdding: .hour, value: 12, to: now) ?? now.addingTimeInterval(12 * 60 * 60)
            
            let dailyOutfitData = DailyOutfitData(
                outfit: outfit,
                createdAt: now,
                expiresAt: expirationDate
            )
            
            // Update and store
            currentDailyOutfit = dailyOutfitData
            storeOutfit(dailyOutfitData)
            
            print("✅ Generated new daily outfit with user location, expires at: \(expirationDate)")
            
        } catch {
            print("❌ Failed to generate daily outfit: \(error)")
        }
    }
    
    /// Get time until next outfit refresh
    func timeUntilNextRefresh() -> String {
        guard let outfit = currentDailyOutfit, !outfit.isExpired else {
            return "Available now"
        }
        
        let timeInterval = outfit.expiresAt.timeIntervalSinceNow
        let hours = Int(timeInterval / 3600)
        let minutes = Int((timeInterval.truncatingRemainder(dividingBy: 3600)) / 60)
        
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
    
    // MARK: - Private Methods
    
    private func loadStoredOutfit() {
        guard let data = userDefaults.data(forKey: dailyOutfitKey) else {
            print("📱 No stored daily outfit found")
            return
        }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let storedOutfit = try decoder.decode(DailyOutfitData.self, from: data)
            
            if storedOutfit.isExpired {
                print("⏰ Stored daily outfit has expired")
                currentDailyOutfit = nil
                userDefaults.removeObject(forKey: dailyOutfitKey)
            } else {
                currentDailyOutfit = storedOutfit
                print("✅ Loaded valid daily outfit, expires at: \(storedOutfit.expiresAt)")
            }
        } catch {
            print("❌ Failed to decode stored daily outfit: \(error)")
            userDefaults.removeObject(forKey: dailyOutfitKey)
        }
    }
    
    private func storeOutfit(_ outfit: DailyOutfitData) {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(outfit)
            userDefaults.set(data, forKey: dailyOutfitKey)
            print("💾 Stored daily outfit data")
        } catch {
            print("❌ Failed to store daily outfit: \(error)")
        }
    }
}

// MARK: - Daily Outfit Card View
struct DailyOutfitCard: View {
    let outfitData: DailyOutfitData
    @Environment(\.colorScheme) private var colorScheme
    
    private var primaryTextColor: Color {
        Color(.label)
    }
    
    private var secondaryTextColor: Color {
        Color(.secondaryLabel)
    }
    
    var body: some View {
        HStack(spacing: 16) {
            // Main outfit preview
            VStack {
                if let topItem = outfitData.outfit.outfit.top {
                    AsyncImage(url: URL(string: topItem.imageURL ?? "")) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Image(systemName: "tshirt")
                            .font(.system(size: 30))
                            .foregroundColor(secondaryTextColor)
                    }
                    .frame(width: 80, height: 80)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.tertiarySystemBackground))
                        .frame(width: 80, height: 80)
                        .overlay(
                            Image(systemName: "tshirt")
                                .font(.system(size: 30))
                                .foregroundColor(secondaryTextColor)
                        )
                }
                
                Text("#Daily")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(primaryTextColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(.systemBackground))
                    .cornerRadius(8)
            }
            
            // Outfit items grid
            VStack(spacing: 8) {
                HStack(spacing: 8) {
                    // Bottom item
                    if let bottomItem = outfitData.outfit.outfit.bottom {
                        AsyncImage(url: URL(string: bottomItem.imageURL ?? "")) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Color(.tertiarySystemBackground)
                        }
                        .frame(width: 50, height: 50)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    } else {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(.tertiarySystemBackground))
                            .frame(width: 50, height: 50)
                    }
                    
                    // Shoes
                    if let shoesItem = outfitData.outfit.outfit.shoes {
                        AsyncImage(url: URL(string: shoesItem.imageURL ?? "")) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Color(.tertiarySystemBackground)
                        }
                        .frame(width: 50, height: 50)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    } else {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(.tertiarySystemBackground))
                            .frame(width: 50, height: 50)
                    }
                }
                
                HStack(spacing: 8) {
                    // Hat or accessory
                    if let hatItem = outfitData.outfit.outfit.hat {
                        AsyncImage(url: URL(string: hatItem.imageURL ?? "")) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Color(.tertiarySystemBackground)
                        }
                        .frame(width: 50, height: 50)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    } else if let firstAccessory = outfitData.outfit.outfit.accessories.first {
                        AsyncImage(url: URL(string: firstAccessory.imageURL ?? "")) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Color(.tertiarySystemBackground)
                        }
                        .frame(width: 50, height: 50)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    } else {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(.tertiarySystemBackground))
                            .frame(width: 50, height: 50)
                    }
                    
                    // Second accessory or placeholder
                    if outfitData.outfit.outfit.accessories.count > 1 {
                        AsyncImage(url: URL(string: outfitData.outfit.outfit.accessories[1].imageURL ?? "")) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Color(.tertiarySystemBackground)
                        }
                        .frame(width: 50, height: 50)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    } else {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(.tertiarySystemBackground))
                            .frame(width: 50, height: 50)
                    }
                }
            }
            
            Spacer()
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }
}