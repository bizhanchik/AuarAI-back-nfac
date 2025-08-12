//
//  ClothingDetailView.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI

struct ClothingDetailView: View {
    let item: ClothingItem
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @State private var showingDeleteAlert = false
    @StateObject private var clothingService = ClothingService()
    @StateObject private var compatibilityCache = WardrobeCompatibilityCache.shared
    @StateObject private var localizationManager = LocalizationManager.shared
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Main Image
                    imageSection
                    
                    // Item Information
                    itemInfoSection
                    
                    // Tags & Context Section
                    if !item.tags.isEmpty || !item.occasions.isEmpty || !item.weatherSuitability.isEmpty {
                        contextSection
                    }
                    
                    Spacer(minLength: 100)
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
            }
            .navigationTitle(item.name)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("close".localized) {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
//                        Button("edit".localized) {
//                            // TODO: Edit functionality
//                        }
                        
                        Button("delete".localized, role: .destructive) {
                            showingDeleteAlert = true
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .alert("delete_item".localized, isPresented: $showingDeleteAlert) {
                Button("cancel".localized, role: .cancel) { }
                Button("delete".localized, role: .destructive) {
                    Task {
                        await deleteItem()
                    }
                }
            } message: {
                Text(String(format: "delete_item_confirmation".localized, item.name))
            }
        }
    }
    
    // MARK: - Image Section
    private var imageSection: some View {
        StandardClothingImageView(imageURL: item.imageURL, size: .large)
    }
    
    // MARK: - Item Info Section
    private var itemInfoSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("details".localized)
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                if isValid(item.category) {
                    DetailRow(title: "category".localized, value: item.category!.capitalized)
                }
                
                if isValid(item.color) {
                    DetailRow(title: "color".localized, value: item.color!.capitalized)
                }
                
                if isValid(item.size) {
                    DetailRow(title: "size".localized, value: item.size!)
                }
                
                if isValid(item.brand) {
                    DetailRow(title: "brand".localized, value: item.brand!)
                }
                
                if isValid(item.gender) {
                    DetailRow(title: "gender".localized, value: item.gender!.capitalized)
                }
                
                if isValid(item.material) {
                    DetailRow(title: "material".localized, value: item.material!.capitalized)
                }
            }
        }
        .padding(20)
        .background(Color(.systemGray6).opacity(0.5))
        .cornerRadius(16)
    }
    
    // MARK: - Context Section (Tags, Occasions, Weather)
    private var contextSection: some View {
        VStack(alignment: .leading, spacing: 20) {
            if !item.tags.isEmpty {
                chipSection(title: "tags".localized, values: item.tags, color: .blue)
            }
            if !item.occasions.isEmpty {
                chipSection(title: "occasions".localized, values: item.occasions, color: .purple)
            }
            if !item.weatherSuitability.isEmpty {
                chipSection(title: "weather".localized, values: item.weatherSuitability, color: .green)
            }
        }
    }
    
    private func chipSection(title: String, values: [String], color: Color) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .fontWeight(.semibold)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 80), spacing: 8)], spacing: 8) {
                ForEach(values, id: \.self) { val in
                    Text(val.capitalized)
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .frame(minHeight: 28)
                        .background(color.opacity(colorScheme == .dark ? 0.25 : 0.15))
                        .foregroundColor(color)
                        .clipShape(Capsule())
                }
            }
        }
    }
    
    // MARK: - Private Methods
    
    private func deleteItem() async {
        do {
            try await clothingService.deleteClothingItem(item.id)
            // Инвалидируем кэш при удалении одежды
            compatibilityCache.invalidateCacheForWardrobeChange()
            dismiss()
        } catch {
            print("Failed to delete item: \(error.localizedDescription)")
            // TODO: Show error alert
        }
    }
    
    // MARK: - Validation Helper
    private func isValid(_ value: String?) -> Bool {
        guard let value = value else { return false }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return !trimmed.isEmpty && trimmed.lowercased() != "null"
    }
}

// MARK: - Detail Row Component
struct DetailRow: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.body)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.body)
                .fontWeight(.medium)
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Preview
#Preview {
    let sampleItem = ClothingItem(
        id: 1,
        name: "Blue Cotton T-Shirt",
        brand: "Nike",
        category: "tops",
        gender: "unisex",
        color: "blue",
        size: "M",
        material: "Cotton",
        description: "Comfortable cotton t-shirt",
        imageURL: nil,
        storeName: "User Upload",
        storeURL: nil,
        productURL: nil,
        price: 0.0,
        tags: ["casual", "summer", "everyday"],
        occasions: ["everyday"],
        weatherSuitability: ["warm"],
        ownerID: 1,
        available: true,
        updatedAt: nil,
        aiGeneratedEmbedding: nil
    )
    
    ClothingDetailView(item: sampleItem)
}
 
