//
//  DashboardView.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI
import Combine

import FirebaseAuth

import CoreLocation

import PhotosUI

import Foundation

struct DashboardView: View {
    let user: User
    @ObservedObject var authService: AuthenticationService
    @StateObject private var clothingService = ClothingService()
    @StateObject private var outfitService = OutfitService()
    @StateObject private var dailyOutfitManager = DailyOutfitManager.shared
    @StateObject private var userPreferences = UserPreferences.shared
    @StateObject private var localizationManager = LocalizationManager.shared
    @StateObject private var locationManager = LocationManager()
    @State private var showAddClothes = false
    @State private var showSettings = false
    @State private var showBodyPhotoOnboarding = false
    @State private var currentWeather: WeatherCondition?
    
    @Environment(\.colorScheme) private var colorScheme
    
    // Dynamic colors
    private var backgroundColor: Color {
        Color(.systemBackground)
    }
    
    private var primaryTextColor: Color {
        Color(.label)
    }
    
    private var secondaryTextColor: Color {
        Color(.secondaryLabel)
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Modern Header
                modernHeader
                
                // Main Content
                ScrollView {
                    VStack(spacing: 24) {
                        // Date and Events Section
//                        dateSection
                        
                        // Statistics Cards
                        statisticsSection
                        
                        // Quick Actions
                        quickActionsSection
                        
                        // Today's Outfits Section
                        todaysOutfitsSection
                        
                        
                        
                        Spacer(minLength: 100)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                }
            }
            .background(backgroundColor)
            .navigationBarHidden(true)
        }
        .navigationViewStyle(StackNavigationViewStyle())
        .sheet(isPresented: $showAddClothes) {
            AddClothesView { newItem in
                // Handle new clothing item added
                clothingService.clothingItems.append(newItem)
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
        .fullScreenCover(isPresented: $showBodyPhotoOnboarding) {
            BodyPhotoOnboardingView {
                showBodyPhotoOnboarding = false
            }
        }
        .task {
            await loadClothingItems()
            await loadWeatherData()
            await dailyOutfitManager.checkAndGenerateOutfitIfNeeded()
        }
    }
    
    // MARK: - Private Methods
    
    private func loadClothingItems() async {
        do {
            try await clothingService.fetchClothingItems()
        } catch {
            print("Failed to load clothing items: \(error.localizedDescription)")
        }
    }
    
    private func loadWeatherData() async {
        do {
            // Request location permission if needed
            await locationManager.requestLocationPermission()
            
            // Get current location or use default coordinates
            let coordinates = locationManager.getCoordinates()
            
            // Fetch weather with user's coordinates
            currentWeather = try await outfitService.getCurrentWeather(coordinates: coordinates)
        } catch {
            print("Failed to load weather data: \(error)")
            // Continue without weather data
        }
    }
    
    // MARK: - Weather Icon Logic
    private func weatherIcon(for temperature: Double) -> String {
        if temperature <= 5 {
            return "snowflake"
        } else if temperature <= 15 {
            return "cloud"
        } else if temperature <= 25 {
            return "cloud.sun"
        } else {
            return "sun.max"
        }
    }
    
    private func weatherIconColor(for temperature: Double) -> Color {
        if temperature <= 5 {
            return .blue
        } else if temperature <= 15 {
            return .gray
        } else if temperature <= 25 {
            return .orange
        } else {
            return .yellow
        }
    }
    
    // MARK: - Modern Header
    private var modernHeader: some View {
        VStack(spacing: 16) {
            HStack {
                // Weather info
                HStack(spacing: 8) {
                    if let weather = currentWeather {
                        Image(systemName: weatherIcon(for: weather.temperature))
                            .foregroundColor(weatherIconColor(for: weather.temperature))
                            .font(.title3)
                        
                        Text("\(Int(weather.temperature))°C")
                            .font(.title3)
                            .fontWeight(.medium)
                            .foregroundColor(primaryTextColor)
                    } else {
                        // Default fallback
                        Image(systemName: "thermometer")
                            .foregroundColor(.gray)
                            .font(.title3)
                        
                        Text("--°C")
                            .font(.title3)
                            .fontWeight(.medium)
                            .foregroundColor(secondaryTextColor)
                    }
                }
                
                Spacer()
                
                // Profile button
                Button {
                    showSettings = true
                } label: {
                    ProfileImageView(
                        imageURL: user.profileImageURL,
                        name: userPreferences.getDisplayName(for: user),
                        size: 40
                    )
                }
            }
            
            // Greeting
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(String(format: "hello_user".localized, userPreferences.getDisplayName(for: user)))
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(primaryTextColor)
                        
                        Text(weatherGreeting)
                            .font(.subheadline)
                            .foregroundColor(secondaryTextColor)
                    }
                    
                    Spacer()
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .background(backgroundColor)
    }
    
    // MARK: - Weather-based greeting
    private var weatherGreeting: String {
        guard let weather = currentWeather else {
            return "stay_stylish".localized
        }
        
        if weather.temperature <= 5 {
            return "stay_warm".localized
        } else if weather.temperature <= 15 {
            return "perfect_weather".localized
        } else if weather.temperature <= 25 {
            return "perfect_weather".localized
        } else {
            return "stay_cool".localized
        }
    }
    
    // MARK: - Date Section
    private var dateSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(getCurrentDate())
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(primaryTextColor)
                    
                    Text("no_events".localized)
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
                
                Spacer()
                
                Button(action: {}) {
                    Image(systemName: "calendar")
                        .font(.title2)
                        .foregroundColor(secondaryTextColor)
                }
            }
        }
        .padding(20)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }
    
    // MARK: - Statistics Section
    private var statisticsSection: some View {
        HStack(spacing: 16) {
            // Wardrobe Stats
            VStack(spacing: 12) {
                HStack {
                    Text("wardrobe".localized)
                        .font(.largeTitle)
                        .fontWeight(.medium)
                        .foregroundColor(primaryTextColor)
                    
                    Spacer()
                    
                    Image(systemName: "hanger")
                        .font(.title3)
                        .foregroundColor(secondaryTextColor)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("\(clothingService.clothingItems.count)")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(primaryTextColor)
                        
                        Spacer()
                    }
                    
                    Text("items".localized)
                        .font(.caption)
                        .foregroundColor(secondaryTextColor)
                }
            }
            .padding(20)
            .frame(maxWidth: .infinity)
            .background(Color(.secondarySystemBackground))
            .cornerRadius(16)
            
            
            // Add button
            VStack {
                Button(action: {
                    showAddClothes = true
                }) {
                    Image(systemName: "plus")
                        .font(.title2)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .frame(width: 50, height: 50)
                        .background(Color.blue)
                        .clipShape(Circle())
                }
                
                Spacer()
                
                
            }
            .frame(maxWidth: 60)
        }
    }
    
    // MARK: - Quick Actions Section
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("quick_actions".localized)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(primaryTextColor)
                
                Spacer()
            }
            
            HStack(spacing: 12) {
                // Add Clothes
                Button(action: {
                    showAddClothes = true
                }) {
                    HStack(spacing: 12) {
                        Image(systemName: "camera.fill")
                            .font(.title3)
                            .foregroundColor(.blue)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("add_clothes".localized)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(primaryTextColor)
                            
                            Text("take_photos".localized)
                                .font(.caption)
                                .foregroundColor(secondaryTextColor)
                        }
                        
                        Spacer()
                    }
                    .padding(16)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                }
                .buttonStyle(.plain)
                
                // Body Analysis
                Button(action: {
                    showBodyPhotoOnboarding = true
                }) {
                    HStack(spacing: 12) {
                        Image(systemName: "figure.stand")
                            .font(.title3)
                            .foregroundColor(.orange)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Анализ тела")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(primaryTextColor)
                            
                            Text("Узнай свои пропорции")
                                .font(.caption)
                                .foregroundColor(secondaryTextColor)
                        }
                        
                        Spacer()
                    }
                    .padding(16)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                }
                .buttonStyle(.plain)
            }
            
            HStack(spacing: 12) {
                // Create Outfit
                NavigationLink(destination: CreateOutfitView()) {
                    HStack(spacing: 12) {
                        Image(systemName: "wand.and.stars")
                            .font(.title3)
                            .foregroundColor(.purple)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("create_outfit".localized)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(primaryTextColor)
                            
                            Text("ai_styling".localized)
                                .font(.caption)
                                .foregroundColor(secondaryTextColor)
                        }
                        
                        Spacer()
                    }
                    .padding(16)
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                }
            }
            
            // Wardrobe button
            NavigationLink(destination: WardrobeView(user: user)) {
                HStack(spacing: 12) {
                    Image(systemName: "tshirt.fill")
                        .font(.title3)
                        .foregroundColor(.green)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("my_wardrobe".localized)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(primaryTextColor)
                        
                        Text("view_all_items".localized)
                            .font(.caption)
                            .foregroundColor(secondaryTextColor)
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundColor(secondaryTextColor)
                }
                .padding(16)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)
            }
        }
    }
    
    // MARK: - Today's Outfits Section
    private var todaysOutfitsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("your_outfits_today".localized)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(primaryTextColor)
                
                Spacer()
                
                if dailyOutfitManager.currentDailyOutfit != nil {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "next_in".localized, dailyOutfitManager.timeUntilNextRefresh()))
                            .font(.caption)
                            .foregroundColor(secondaryTextColor)
                        
                    }
                } else {
                    Button("generate".localized) {
                        Task {
                            await dailyOutfitManager.generateNewDailyOutfit()
                        }
                    }
                    .font(.subheadline)
                    .foregroundColor(.blue)
                }
            }
            
            // Outfit display
            if dailyOutfitManager.isGenerating {
                // Loading state
                HStack(spacing: 16) {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.tertiarySystemBackground))
                        .frame(width: 120, height: 160)
                        .overlay(
                            VStack {
                                ProgressView()
                                    .scaleEffect(1.2)
                                
                                Text("creating".localized)
                                    .font(.caption)
                                    .foregroundColor(secondaryTextColor)
                                    .padding(.top, 8)
                            }
                        )
                    
                    VStack(spacing: 8) {
                        HStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color(.tertiarySystemBackground))
                                .frame(width: 60, height: 60)
                                .overlay(ProgressView().scaleEffect(0.8))
                            
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color(.tertiarySystemBackground))
                                .frame(width: 60, height: 60)
                                .overlay(ProgressView().scaleEffect(0.8))
                        }
                        
                        HStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color(.tertiarySystemBackground))
                                .frame(width: 60, height: 60)
                                .overlay(ProgressView().scaleEffect(0.8))
                            
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color(.tertiarySystemBackground))
                                .frame(width: 60, height: 60)
                                .overlay(ProgressView().scaleEffect(0.8))
                        }
                    }
                    
                    Spacer()
                }
                .padding(16)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(16)
                
            } else if let outfitData = dailyOutfitManager.currentDailyOutfit {
                // Show actual outfit
                DailyOutfitCard(outfitData: outfitData)
                
            } else {
                // Empty state
                HStack(spacing: 16) {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.tertiarySystemBackground))
                        .frame(width: 120, height: 160)
                        .overlay(
                            VStack {
                                Image(systemName: "wand.and.stars")
                                    .font(.system(size: 40))
                                    .foregroundColor(secondaryTextColor)
                                
                                Text("generate_daily_outfit".localized)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .foregroundColor(primaryTextColor)
                                    .multilineTextAlignment(.center)
                                    .padding(.top, 8)
                            }
                        )
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("no_outfit_yet".localized)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(primaryTextColor)
                        
                        Text("generate_outfit_description".localized)
                            .font(.caption)
                            .foregroundColor(secondaryTextColor)
                            .multilineTextAlignment(.leading)
                        
                        Button("generate_now".localized) {
                            Task {
                                await dailyOutfitManager.generateNewDailyOutfit()
                            }
                        }
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue)
                        .cornerRadius(8)
                        .padding(.top, 4)
                    }
                    
                    Spacer()
                }
                .padding(16)
                .background(Color(.secondarySystemBackground))
                .cornerRadius(16)
            }
        }
    }
    
    
    // MARK: - Helper Methods
    private func getCurrentDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, d MMMM"
        return formatter.string(from: Date())
    }
}


// MARK: - Quick Action Card View Component
struct QuickActionCardView: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(color.opacity(colorScheme == .dark ? 0.25 : 0.1))
                    .frame(width: 50, height: 50)
                
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(color)
            }
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
            Text(subtitle)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 120)
        .padding(12)
        .background(Color.cardBackground)
        .cornerRadius(16)
        .shadow(color: Color.dynamicShadow, radius: 8, x: 0, y: 2)
    }
}

// MARK: - Coming Soon Card Component
struct ComingSoonCard: View {
    let icon: String
    let title: String
    let description: String
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(Color(.systemGray4).opacity(colorScheme == .dark ? 0.25 : 0.1))
                    .frame(width: 44, height: 44)
                
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(Color(.systemGray))
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.leading)
            }
            
            Spacer()
            
            Text("soon".localized)
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundColor(.primary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(.systemGray5))
                .cornerRadius(8)
        }
        .padding(16)
        .background(Color.cardBackground)
        .cornerRadius(12)
        .shadow(color: Color.dynamicShadow, radius: 4, x: 0, y: 1)
    }
}

// MARK: - Preview
#Preview {
    DashboardView(
        user: User(
            id: "123",
            email: "user@example.com",
            name: "John Doe"
        ),
        authService: AuthenticationService()
    )
}
 
