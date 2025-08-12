//
//  ProfileImageView.swift
//  AuarAI
//
//  Created by AuarAI on 21.07.2025.
//

import SwiftUI

// MARK: - Profile Image View
struct ProfileImageView: View {
    let imageURL: URL?
    let name: String
    let size: CGFloat
    
    init(imageURL: URL?, name: String, size: CGFloat = 60) {
        self.imageURL = imageURL
        self.name = name
        self.size = size
    }
    
    var body: some View {
        Group {
            if let imageURL = imageURL {
                AsyncImage(url: imageURL) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    defaultProfileView
                }
            } else {
                defaultProfileView
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }
    
    private var defaultProfileView: some View {
        Circle()
            .fill(
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color.blue.opacity(0.8),
                        Color.purple.opacity(0.8)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .overlay(
                Text(firstLetter)
                    .font(.system(size: size * 0.4, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
            )
    }
    
    private var firstLetter: String {
        let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        return String(cleanName.prefix(1)).uppercased()
    }
}

// MARK: - Preview
#Preview {
    VStack(spacing: 20) {
        ProfileImageView(imageURL: nil, name: "John Doe", size: 80)
        ProfileImageView(imageURL: nil, name: "Alice", size: 60)
        ProfileImageView(imageURL: nil, name: "Bob Smith", size: 40)
        ProfileImageView(imageURL: nil, name: "", size: 60) // Empty name test
    }
    .padding()
}