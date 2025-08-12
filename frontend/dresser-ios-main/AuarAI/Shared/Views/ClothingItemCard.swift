//
//  ClothingItemCard.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI

struct ClothingItemCard: View {
    let item: ClothingItem
    let onTap: () -> Void
    
    @Environment(\.colorScheme) private var colorScheme
    @StateObject private var localizationManager = LocalizationManager.shared
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Image Section with modern styling
            StandardClothingImageView(imageURL: item.imageURL, size: .medium)
                .overlay(
                    // Subtle gradient overlay for text readability
                    LinearGradient(
                        colors: [
                            Color(.label).opacity(0.1),
                            Color.clear
                        ],
                        startPoint: .bottom,
                        endPoint: .top
                    )
                )
        }
        .background(Color.clear)
        .onTapGesture {
            onTap()
        }
    }
}

// MARK: - Preview
struct ClothingItemCard_Previews: PreviewProvider {
    static var previews: some View {
        let sampleItem = ClothingItem(
            id: 1,
            name: "Royal Blue Performance T-Shirt",
            brand: "Nike",
            category: "T-Shirt",
            gender: "unisex",
            color: "Royal Blue",
            size: "M",
            material: "Cotton",
            description: "Comfortable cotton t-shirt",
            imageURL: nil,
            storeName: "User Upload",
            storeURL: nil,
            productURL: nil,
            price: 0.0,
            tags: ["casual", "summer", "sport", "comfortable"],
            occasions: ["everyday"],
            weatherSuitability: ["warm"],
            ownerID: 1,
            available: true,
            updatedAt: nil,
            aiGeneratedEmbedding: nil
        )
        
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            ClothingItemCard(item: sampleItem) {
                print("Tapped clothing item")
            }
            
            ClothingItemCard(item: sampleItem) {
                print("Tapped clothing item")
            }
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}
 
