//
//  LandingPageView.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI

struct LandingPageView: View {
    let onStartUsing: () -> Void
    @StateObject private var localizationManager = LocalizationManager.shared
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(.systemBackground),
                        Color(.systemGray6).opacity(0.3)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 0) {
                        // Hero Section
                        heroSection
                        
                        // Features Section
                        featuresSection
                        
                        // CTA Section
                        ctaSection
                        
                        Spacer(minLength: 100)
                    }
                }
            }
        }
    }
    
    // MARK: - Hero Section
    private var heroSection: some View {
        VStack(spacing: 24) {
            Spacer(minLength: 60)
            
            // Avatar and Title on same line
            HStack(alignment: .center, spacing: 16) {
                // App Icon/Logo
                ZStack {
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
                        .frame(width: 80, height: 80)
                        .shadow(color: Color.dynamicShadow, radius: 15, x: 0, y: 8)
                    
                    Image(systemName: "sparkles")
                        .font(.system(size: 32, weight: .light))
                        .foregroundColor(.white)
                }
                
                // Main Title
                Text("AuarAI")
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .foregroundColor(.primary)
            }
            
            // Subtitle
            Text("personal_ai_stylist".localized)
                .font(.title2)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            // Description
            Text("landing_description".localized)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .lineLimit(nil)
                .padding(.horizontal, 32)
            
            Spacer(minLength: 40)
        }
        .padding(.horizontal, 20)
    }
    
    // MARK: - Features Section
    private var featuresSection: some View {
        VStack(spacing: 32) {
            // Section Title
            Text("what_auarai_does".localized)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
                .padding(.horizontal, 20)
            
            // Feature Cards
            VStack(spacing: 20) {
                FeatureCard(
                    icon: "camera.fill",
                    iconColor: .blue,
                    title: "smart_wardrobe".localized,
                    description: "smart_wardrobe_description".localized
                )
                
                FeatureCard(
                    icon: "cloud.sun.fill",
                    iconColor: .orange,
                    title: "weather_based_styling".localized,
                    description: "weather_based_styling_description".localized
                )
                
                FeatureCard(
                    icon: "wand.and.stars",
                    iconColor: .purple,
                    title: "ai_powered_recommendations".localized,
                    description: "ai_powered_recommendations_description".localized
                )
            }
            .padding(.horizontal, 20)
        }
    }
    
    // MARK: - CTA Section
    private var ctaSection: some View {
        VStack(spacing: 24) {
            Text("ready_to_transform".localized)
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
                .multilineTextAlignment(.center)
            
            // Start Using Button
            Button(action: onStartUsing) {
                HStack(spacing: 12) {
                    Image(systemName: "arrow.right.circle.fill")
                        .font(.system(size: 20))
                    
                    Text("start_using_auarai".localized)
                        .font(.headline)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            Color.blue,
                            Color.purple
                        ]),
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(16)
                .shadow(color: .blue.opacity(0.3), radius: 10, x: 0, y: 5)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)
        }
        .padding(.top, 40)
    }
}

// MARK: - Feature Card Component
struct FeatureCard: View {
    let icon: String
    let iconColor: Color
    let title: String
    let description: String
    
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            // Icon
            ZStack {
                Circle()
                    .fill(iconColor.opacity(colorScheme == .dark ? 0.25 : 0.1))
                    .frame(width: 50, height: 50)
                
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(iconColor)
            }
            
            // Content
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Text(description)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.leading)
            }
            
            Spacer()
        }
        .padding(20)
        .background(Color.cardBackground)
        .cornerRadius(16)
        .shadow(color: Color.dynamicShadow, radius: 8, x: 0, y: 2)
    }
}

// MARK: - Preview
#Preview {
    LandingPageView {
        print("Start Using tapped")
    }
}