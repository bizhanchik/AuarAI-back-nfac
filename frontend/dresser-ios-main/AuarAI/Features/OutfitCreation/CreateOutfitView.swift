//
//  CreateOutfitView.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI

struct CreateOutfitView: View {
    @StateObject private var outfitService = OutfitService()
    @StateObject private var localizationManager = LocalizationManager.shared
    @StateObject private var locationManager = LocationManager()
    @State private var selectedOccasion: OutfitOccasion?
    @State private var selectedStylePreference: StylePreference = .casual
    @State private var currentWeather: WeatherCondition?
    @State private var considerWeather = true
    @State private var creationState: OutfitCreationState = .idle
    @State private var generatedOutfits: [OutfitResponse] = []
    @State private var selectedOutfitIndex = 0
    
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                headerSection
                
                // Content based on state
                ScrollView {
                    VStack(spacing: 24) {
                        switch creationState {
                        case .idle, .selectingOccasions:
                            occasionSelectionSection
                            
                        case .selectingStyle:
                            styleSelectionSection
                            
                        case .generating:
                            generatingSection
                            
                        case .completed:
                            if !generatedOutfits.isEmpty {
                                outfitDisplaySection
                            }
                            
                        case .error(let message):
                            errorSection(message: message)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                }
                
                // Bottom action buttons
                bottomActionSection
            }
            .navigationTitle("create_outfit".localized)
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden()
            
        }
        .task {
            await loadWeatherData()
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 12) {
            // Progress indicator
            progressIndicator
            
            // Weather info
            if let weather = currentWeather {
                weatherInfoCard(weather: weather)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.05), radius: 1, x: 0, y: 1)
    }
    
    private var progressIndicator: some View {
        HStack {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(progressColor(for: index))
                    .frame(width: 8, height: 8)
                
                if index < 2 {
                    Rectangle()
                        .fill(progressColor(for: index))
                        .frame(height: 2)
                }
            }
        }
        .frame(maxWidth: 150)
    }
    
    private func progressColor(for index: Int) -> Color {
        let currentStep = getCurrentStep()
        return index <= currentStep ? .blue : .gray.opacity(0.3)
    }
    
    private func getCurrentStep() -> Int {
        switch creationState {
        case .idle, .selectingOccasions:
            return 0
        case .selectingStyle:
            return 1
        case .generating, .completed, .error:
            return 2
        }
    }
    
    private func weatherInfoCard(weather: WeatherCondition) -> some View {
        HStack {
            Image(systemName: weatherIcon(for: weather.condition))
                .font(.title2)
                .foregroundColor(.blue)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(weather.displayString)
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Text(weather.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.blue.opacity(0.1))
        .cornerRadius(12)
    }
    
    private func weatherIcon(for condition: String) -> String {
        let conditionLower = condition.lowercased()
        if conditionLower.contains("sun") || conditionLower.contains("clear") {
            return "sun.max"
        } else if conditionLower.contains("cloud") {
            return "cloud"
        } else if conditionLower.contains("rain") {
            return "cloud.rain"
        } else if conditionLower.contains("snow") {
            return "snow"
        } else {
            return "cloud.sun"
        }
    }
    
    // MARK: - Occasion Selection Section
    private var occasionSelectionSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("choose_occasion".localized)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("select_occasion_description".localized)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: 16),
                GridItem(.flexible(), spacing: 16)
            ], spacing: 16) {
                ForEach(OutfitOccasion.allCases, id: \.self) { occasion in
                    OccasionCard(
                        occasion: occasion,
                        isSelected: selectedOccasion == occasion,
                        onTap: {
                            selectedOccasion = occasion
                        }
                    )
                }
            }
            
            if let occasion = selectedOccasion {
                VStack(alignment: .leading, spacing: 8) {
                    Text("selected_occasion".localized)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(occasion.displayName)
                        .font(.subheadline)
                        .foregroundColor(.blue)
                }
                .padding(.top, 16)
            }
        }
    }
    
    // MARK: - Style Selection Section
    private var styleSelectionSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("your_style".localized)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(String(format: "selected_style".localized, selectedStylePreference.displayName))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            if let occasion = selectedOccasion {
                VStack(alignment: .leading, spacing: 12) {
                    Text("selected_occasion".localized)
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    HStack(spacing: 6) {
                        Image(systemName: occasion.icon)
                            .font(.caption)
                        
                        Text(occasion.displayName)
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(occasion.themeColor.opacity(0.2))
                    .foregroundColor(occasion.themeColor)
                    .cornerRadius(12)
                }
            }
            
            // Weather info card - only if weather is considered
            if considerWeather, let weather = currentWeather {
                weatherInfoCard(weather: weather)
            }
            
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
    }
    
    // MARK: - Generating Section
    private var generatingSection: some View {
        VStack(spacing: 24) {
            VStack(spacing: 16) {
                ProgressView()
                    .scaleEffect(1.2)
                    .tint(.blue)
                
                Text("generating_outfit".localized)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("ai_analyzing".localized)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.vertical, 40)
        }
    }
    
    // MARK: - Outfit Display Section
    private var outfitDisplaySection: some View {
        VStack(spacing: 24) {
            // Current outfit display (always display the first if available)
            if generatedOutfits.indices.contains(selectedOutfitIndex) {
                OutfitDisplayCard(outfit: generatedOutfits[selectedOutfitIndex])
            }
        }
    }
    
    // MARK: - Error Section
    private func errorSection(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(.red)
            
            Text("something_went_wrong".localized)
                .font(.title2)
                .fontWeight(.bold)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 40)
    }
    
    // MARK: - Bottom Action Section
    private var bottomActionSection: some View {
        VStack(spacing: 16) {
            HStack {
                if creationState != .idle && creationState != .selectingOccasions {
                    Button("back".localized) {
                        goBack()
                    }
                    .foregroundColor(.blue)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(12)
                }
                
                Spacer()
                
                Button(action: {
                    handleMainAction()
                }) {
                    Text(mainActionTitle)
                        .fontWeight(.semibold)
                        .foregroundColor(isMainActionEnabled ? .white : .secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            isMainActionEnabled
                                ? Color.blue
                                : Color(.systemGray4).opacity(0.3)
                        )
                        .cornerRadius(12)
                }
                .disabled(!isMainActionEnabled)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.05), radius: 1, x: 0, y: -1)
    }
    
    private var mainActionTitle: String {
        switch creationState {
        case .idle, .selectingOccasions:
            return "continue".localized
        case .selectingStyle:
            return "create_outfit".localized
        case .generating:
            return "generating".localized
        case .completed:
            return "done".localized
        case .error:
            return "try_again".localized
        }
    }
    
    private var isMainActionEnabled: Bool {
        switch creationState {
        case .idle, .selectingOccasions:
            return selectedOccasion != nil
        case .selectingStyle:
            return true
        case .generating:
            return false
        case .completed:
            return true
        case .error:
            return true
        }
    }
    
    // MARK: - Actions
    private func handleMainAction() {
        switch creationState {
        case .idle, .selectingOccasions:
            if selectedOccasion != nil {
                creationState = .selectingStyle
            }
        case .selectingStyle:
            Task {
                await generateOutfit()
            }
        case .completed:
            dismiss()
        case .error:
            creationState = .selectingOccasions
        case .generating:
            break
        }
    }
    
    private func goBack() {
        withAnimation {
            switch creationState {
            case .selectingStyle:
                creationState = .selectingOccasions
            case .completed, .error:
                creationState = .selectingStyle
            default:
                break
            }
        }
    }
    
    private func generateOutfit() async {
        guard let occasion = selectedOccasion else { return }
        
        creationState = .generating
        do {
            // Get current location coordinates
            let coordinates = locationManager.getCoordinates()
            
            let outfit = try await outfitService.createOutfit(
                occasion: occasion,
                weather: considerWeather ? currentWeather : nil,
                stylePreference: selectedStylePreference
            )
            generatedOutfits = [outfit]
            creationState = .completed
        } catch {
            creationState = .error(error.localizedDescription)
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
}

// MARK: - Supporting Views

struct OccasionCard: View {
    let occasion: OutfitOccasion
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 12) {
                Image(systemName: occasion.icon)
                    .font(.title2)
                    .foregroundColor(isSelected ? .white : occasion.themeColor)
                
                Text(occasion.displayName)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(isSelected ? .white : .primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 24)
            .background(
                Group {
                    if isSelected {
                        occasion.themeColor
                    } else {
                        occasion.themeColor.opacity(0.1)
                    }
                }
            )
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        isSelected ? Color.clear : occasion.themeColor.opacity(0.3),
                        lineWidth: 1
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct OutfitDisplayCard: View {
    let outfit: OutfitResponse
    
    var body: some View {
        VStack(spacing: 20) {
            // Outfit header
            VStack(spacing: 8) {
                Text("outfit_ready".localized)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("outfit_suggestion_message".localized)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            // Outfit items
            outfitItemsGrid
            
            // Styling tips
            if !outfit.outfit.stylingTips.isEmpty {
                stylingTipsCard
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 24)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
    }
    
    private var outfitItemsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible(minimum: 120, maximum: 160), spacing: 12),
            GridItem(.flexible(minimum: 120, maximum: 160), spacing: 12)
        ], spacing: 16) {
            if let top = outfit.outfit.top {
                OutfitItemCard(item: top, category: "Top")
            }
            
            if let bottom = outfit.outfit.bottom {
                OutfitItemCard(item: bottom, category: "Bottom")
            }
            
            if let shoes = outfit.outfit.shoes {
                OutfitItemCard(item: shoes, category: "Shoes")
            }
            
            if let hat = outfit.outfit.hat {
                OutfitItemCard(item: hat, category: "Hat")
            }
            
            ForEach(outfit.outfit.accessories, id: \.id) { accessory in
                OutfitItemCard(item: accessory, category: "Accessory")
            }
        }
    }
    
    private var stylingTipsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("styling_tips".localized)
                .font(.headline)
                .fontWeight(.semibold)
            
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(.yellow)
                    .font(.caption)
                    .padding(.top, 2)
                
                Text(outfit.outfit.stylingTips)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.leading)
                
                Spacer()
            }
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct OutfitItemCard: View {
    let item: ClothingItem
    let category: String
    
    var body: some View {
        VStack(spacing: 8) {
            // Image
            AsyncImage(url: URL(string: item.imageURL ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color(.systemGray5))
                    .overlay(
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                            .font(.title2)
                    )
            }
            .frame(height: 100)
            .clipped()
            .cornerRadius(8)
            
            // Item details
            VStack(alignment: .leading, spacing: 4) {
                Text(localizedCategoryName)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.blue)
                
                Text(item.name)
                    .font(.footnote)
                    .fontWeight(.semibold)
                    .lineLimit(2)
                
                if let color = item.color {
                    Text(color)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
    
    private var localizedCategoryName: String {
        switch category.lowercased() {
        case "top":
            return "category_top".localized
        case "bottom":
            return "category_bottom".localized
        case "shoes":
            return "category_shoes".localized
        case "hat":
            return "category_hat".localized
        case "accessory":
            return "category_accessory".localized
        default:
            return category
        }
    }
    
    private func categoryIcon(for category: String) -> String {
        switch category.lowercased() {
        case "top":
            return "tshirt"
        case "bottom":
            return "rectangle.stack"
        case "shoes":
            return "shoe.2"
        case "hat":
            return "hat.cap"
        case "accessory":
            return "bag"
        default:
            return "tshirt"
        }
    }
}
 
