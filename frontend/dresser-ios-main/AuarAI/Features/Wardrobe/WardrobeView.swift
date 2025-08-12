//
//  WardrobeView.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI

struct WardrobeView: View {
    let user: User
    @StateObject private var clothingService = ClothingService()
    @StateObject private var localizationManager = LocalizationManager.shared
    @StateObject private var authService = AuthenticationService()
    @StateObject private var userPreferences = UserPreferences.shared
    @StateObject private var compatibilityCache = WardrobeCompatibilityCache.shared
    @StateObject private var bodyAnalysisService = BodyAnalysisService()
    @State private var showAddClothes = false
    @State private var showingCreateOutfit = false
    @State private var selectedItem: ClothingItem?
    @State private var searchText = ""
    @State private var selectedCategory = "all"
    @State private var wardrobeCompatibility: WardrobeCompatibilityResult?
    @State private var isLoadingCompatibility = false
    
    @Environment(\.colorScheme) private var colorScheme
    
    // Category filters
    private let categories = ["all", "shirts", "pants", "shoes", "accessories"]
    
    // Computed property to filter clothing items based on search text and category
    private var filteredItems: [ClothingItem] {
        var items = clothingService.clothingItems
        
        // Filter by category first
        if selectedCategory != "all" {
            items = items.filter { item in
                let category = (item.category ?? "").lowercased()
                switch selectedCategory {
                case "shirts":
                    return category.contains("shirt") || category.contains("top") || category.contains("blouse") || category.contains("sweater") || category.contains("hoodie")
                case "pants":
                    return category.contains("pants") || category.contains("jeans") || category.contains("trousers") || category.contains("shorts") || category.contains("bottom")
                case "shoes":
                    return category.contains("shoes") || category.contains("sneakers") || category.contains("boots") || category.contains("sandals")
                case "accessories":
                    return category.contains("hat") || category.contains("bag") || category.contains("belt") || category.contains("jewelry") || category.contains("accessory")
                default:
                    return true
                }
            }
        }
        
        // Then filter by search text
        if !searchText.isEmpty {
            let text = searchText.lowercased()
            items = items.filter { item in
                return item.name.lowercased().contains(text) ||
                       (item.brand?.lowercased().contains(text) ?? false) ||
                       (item.color?.lowercased().contains(text) ?? false) ||
                       item.tags.contains { $0.lowercased().contains(text) }
            }
        }
        
        return items
    }
    
    // Dynamic colors based on current theme - using system colors
    private var backgroundColor: Color {
        Color(.systemBackground)
    }
    
    private var primaryTextColor: Color {
        Color(.label)
    }
    
    private var secondaryTextColor: Color {
        Color(.secondaryLabel)
    }
    
    private var searchBackgroundColor: Color {
        Color(.secondarySystemBackground)
    }
    
    private var searchBorderColor: Color {
        Color(.separator)
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Modern Header with Profile and Title
                modernHeader
                
                // Search Section
                modernSearchSection
                
                // Category Filter Tabs
                categoryTabs
                
                // Content
                if clothingService.isLoading {
                    loadingView
                } else if filteredItems.isEmpty {
                    emptyStateView
                } else {
                    clothingGrid
                }
            }
            .background(backgroundColor)
            .navigationBarHidden(true)
        }
        .navigationViewStyle(StackNavigationViewStyle())
        .sheet(isPresented: $showAddClothes) {
            AddClothesView { newItem in
                // Инвалидируем кэш при добавлении новой одежды
                compatibilityCache.invalidateCacheForWardrobeChange()
                // Refresh the wardrobe when new item is added
                Task {
                    await loadClothingItems()
                }
            }
        }
        .sheet(isPresented: $showingCreateOutfit) {
            CreateOutfitView()
        }
        .sheet(item: $selectedItem) { item in
            ClothingDetailView(item: item)
        }
        .task {
            await loadClothingItems()
        }
    }
    
    // MARK: - Modern Search Section
    private var modernSearchSection: some View {
        VStack(spacing: 0) {
            HStack(spacing: 16) {
                // Search Bar
                HStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(secondaryTextColor)
                        .font(.system(size: 16, weight: .medium))
                    
                    TextField("search_clothes".localized, text: $searchText)
                        .foregroundColor(primaryTextColor)
                        .font(.system(size: 16))
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(searchBackgroundColor)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(searchBorderColor, lineWidth: 1)
                        )
                )
                
                // Clear search button (only show when there's text)
                if !searchText.isEmpty {
                    Button(action: {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            searchText = ""
                        }
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(secondaryTextColor)
                            .font(.system(size: 20))
                    }
                    .transition(.scale.combined(with: .opacity))
                }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 16)
            
            // Wardrobe Compatibility Section
            if let compatibility = wardrobeCompatibility {
                VStack(spacing: 12) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.system(size: 16))
                        
                        Text("wardrobe_compatibility".localized)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(primaryTextColor)
                        
                        Spacer()
                        
                        Text("\(Int(compatibility.compatibility_percentage))%")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(compatibilityColor(for: compatibility.compatibility_percentage))
                    }
                    
                    // Progress bar
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(height: 6)
                                .cornerRadius(3)
                            
                            Rectangle()
                                .fill(compatibilityColor(for: compatibility.compatibility_percentage))
                                .frame(width: geometry.size.width * (compatibility.compatibility_percentage / 100), height: 6)
                                .cornerRadius(3)
                                .animation(.easeInOut(duration: 0.5), value: compatibility.compatibility_percentage)
                        }
                    }
                    .frame(height: 6)
                    
                    if !compatibility.recommendations.isEmpty {
                        Text(compatibility.recommendations.first ?? "")
                            .font(.system(size: 14))
                            .foregroundColor(secondaryTextColor)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(backgroundColor)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 16)
            } else if isLoadingCompatibility {
                VStack(spacing: 12) {
                    HStack {
                        ProgressView()
                            .scaleEffect(0.8)
                        
                        Text("analyzing_wardrobe".localized)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(primaryTextColor)
                        
                        Spacer()
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(backgroundColor)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 16)
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 16)
        .background(backgroundColor)
    }
    
    // MARK: - Modern Header
    private var modernHeader: some View {
        VStack(spacing: 16) {
            // Profile and Title Section
            HStack(spacing: 16) {
                // User Profile Image
                ProfileImageView(
                    imageURL: user.profileImageURL,
                    name: userPreferences.getDisplayName(for: user),
                    size: 50
                )
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("my_wardrobe".localized)
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(primaryTextColor)
                    
                    Text("\(clothingService.clothingItems.count) \("items".localized)")
                        .font(.subheadline)
                        .foregroundColor(secondaryTextColor)
                }
                
                Spacer()
                
                // Add Button
                Button(action: {
                    showAddClothes = true
                }) {
                    Image(systemName: "plus")
                        .font(.title2)
                        .fontWeight(.medium)
                        .foregroundColor(Color(.systemBackground))
                        .frame(width: 40, height: 40)
                        .background(Color(.label))
                        .clipShape(Circle())
                }
            }
            .padding(.horizontal, 24)
        }
        .padding(.top, 16)
        .background(backgroundColor)
    }
    
    // MARK: - Category Tabs
    private var categoryTabs: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 32) {
                ForEach(categories, id: \.self) { category in
                    VStack(spacing: 8) {
                        Text(category.localized)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(selectedCategory == category ? primaryTextColor : secondaryTextColor)
                        
                        Rectangle()
                            .fill(selectedCategory == category ? primaryTextColor : Color.clear)
                            .frame(height: 2)
                            .frame(width: 40)
                    }
                    .onTapGesture {
                        withAnimation(.easeInOut(duration: 0.3)) {
                            selectedCategory = category
                        }
                    }
                }
            }
            .padding(.horizontal, 24)
        }
        .padding(.vertical, 20)
        .background(backgroundColor)
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 20) {
            // Skeleton loading cards
            LazyVGrid(columns: [
                GridItem(.fixed(180), spacing: 10),
                GridItem(.fixed(180), spacing: 10)
            ], spacing: 20) {
                ForEach(0..<6, id: \.self) { _ in
                    ModernSkeletonCard(colorScheme: colorScheme)
                }
            }
            .padding(.horizontal, 20)
            .frame(maxWidth: .infinity)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(backgroundColor)
    }
    
    // MARK: - Empty State View
    private var emptyStateView: some View {
        VStack(spacing: 32) {
            Spacer()
            
            VStack(spacing: 24) {
                Image(systemName: "tshirt")
                    .font(.system(size: 80, weight: .light))
                    .foregroundColor(secondaryTextColor)
                
                VStack(spacing: 12) {
                    Text("no_clothes_yet".localized)
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(primaryTextColor)
                    
                    Text("start_building_wardrobe".localized)
                        .font(.body)
                        .foregroundColor(secondaryTextColor)
                        .multilineTextAlignment(.center)
                }
                
                Button(action: {
                    showAddClothes = true
                }) {
                    HStack(spacing: 12) {
                        Image(systemName: "plus")
                        Text("add_first_item".localized)
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 16)
                    .background(Color.blue)
                    .cornerRadius(25)
                }
                .padding(.top, 8)
            }
            
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(backgroundColor)
    }
    
    // MARK: - Clothing Grid
    private var clothingGrid: some View {
        ScrollView {
            LazyVGrid(columns: [
                GridItem(.fixed(180), spacing: 10),
                GridItem(.fixed(180), spacing: 10)
            ], spacing: 24) {
                ForEach(filteredItems) { item in
                    ClothingItemCard(item: item) {
                        selectedItem = item
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 100)
            .frame(maxWidth: .infinity)
        }
        .background(backgroundColor)
        .refreshable {
            await loadClothingItems()
        }
    }
    
    // MARK: - Private Methods
    
    private func loadClothingItems() async {
        do {
            try await clothingService.fetchClothingItems()
            // После загрузки одежды запускаем анализ совместимости с кэшированием
            await analyzeWardrobeCompatibility()
        } catch {
            print("Failed to load clothing items: \(error.localizedDescription)")
            // TODO: Show error alert
        }
    }
    
    private func analyzeWardrobeCompatibility() async {
        guard !clothingService.clothingItems.isEmpty else { return }
        
        // Используем кэшированный результат или выполняем новый анализ
        do {
            let result = try await compatibilityCache.getCompatibilityResult(
                clothingService: clothingService,
                bodyAnalysisService: bodyAnalysisService
            )
            
            await MainActor.run {
                wardrobeCompatibility = result
                isLoadingCompatibility = compatibilityCache.isLoading
            }
        } catch {
            print("Failed to analyze wardrobe compatibility: \(error.localizedDescription)")
            await MainActor.run {
                isLoadingCompatibility = false
            }
        }
    }
    
    private func compatibilityColor(for percentage: Double) -> Color {
        switch percentage {
        case 80...100:
            return .green
        case 60..<80:
            return .orange
        default:
            return .red
        }
    }
}

// MARK: - Modern Skeleton Card
struct ModernSkeletonCard: View {
    @State private var isAnimating = false
    let colorScheme: ColorScheme
    
    private var skeletonBaseColor: Color {
        Color(.systemGray4)
    }
    
    private var skeletonHighlightColor: Color {
        Color(.systemGray5)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Image placeholder
            Rectangle()
                .fill(skeletonBaseColor)
                .frame(height: 200)
                .cornerRadius(12)
                .overlay(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            skeletonBaseColor.opacity(0.1),
                            skeletonHighlightColor,
                            skeletonBaseColor.opacity(0.1)
                        ]),
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .mask(
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    gradient: Gradient(stops: [
                                        .init(color: .clear, location: 0),
                                        .init(color: .white, location: 0.5),
                                        .init(color: .clear, location: 1)
                                    ]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .rotationEffect(.degrees(70))
                            .offset(x: isAnimating ? 200 : -200)
                    )
                )
        }
        .background(Color.clear)
        .onAppear {
            withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                isAnimating = true
            }
        }
    }
}

// MARK: - Skeleton Loading Card
struct SkeletonClothingCard: View {
    @State private var isAnimating = false
    let colorScheme: ColorScheme
    
    private var skeletonBaseColor: Color {
        Color(.systemGray4)
    }
    
    private var skeletonHighlightColor: Color {
        Color(.systemGray5)
    }
    
    private var backgroundColor: Color {
        Color(.systemBackground)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Image placeholder
            Rectangle()
                .fill(skeletonBaseColor)
                .frame(height: 200)
                .cornerRadius(16)
                .overlay(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            skeletonBaseColor.opacity(0.1),
                            skeletonHighlightColor,
                            skeletonBaseColor.opacity(0.1)
                        ]),
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .mask(
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    gradient: Gradient(stops: [
                                        .init(color: .clear, location: 0),
                                        .init(color: .white, location: 0.5),
                                        .init(color: .clear, location: 1)
                                    ]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .rotationEffect(.degrees(70))
                            .offset(x: isAnimating ? 200 : -200)
                    )
                )
            
            // Text placeholders
            VStack(alignment: .leading, spacing: 12) {
                Rectangle()
                    .fill(skeletonBaseColor)
                    .frame(height: 16)
                    .cornerRadius(8)
                
                Rectangle()
                    .fill(skeletonBaseColor.opacity(0.7))
                    .frame(height: 14)
                    .frame(width: 80)
                    .cornerRadius(7)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(backgroundColor)
        .cornerRadius(16)
        .onAppear {
            withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                isAnimating = true
            }
        }
    }
}

#Preview {
    WardrobeView(user: User(id: "test", email: "test@example.com", name: "Test User", profileImageURL: nil))
}
 
