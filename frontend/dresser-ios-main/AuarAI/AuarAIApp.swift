//
//  AuarAIApp.swift
//  AuarAI
//
//  Created by Bizhan on 01.07.2025.
//

import SwiftUI
import FirebaseCore

@main
struct AuarAIApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @StateObject private var authService = AuthenticationService()
    @StateObject private var localizationManager = LocalizationManager.shared
    @State private var showAuthentication = false
    @State private var hasCompletedOnboarding = false
    @State private var authViewId = UUID() // Добавляем уникальный идентификатор
    
    var body: some Scene {
        WindowGroup {
            Group {
                switch authService.authenticationState {
                case .authenticated(let user):
                    // User is authenticated - show main dashboard
                    DashboardView(user: user, authService: authService)
                    
                case .authenticating, .checkingAuth:
                    // Show loading state during authentication or initial check
                    ZStack {
                        // Background
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(.systemBackground),
                                Color(.systemGray6).opacity(0.2)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                        .ignoresSafeArea()
                        
                        VStack(spacing: 24) {
                            // App Logo
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
                                    .frame(width: 100, height: 100)
                                    .shadow(color: .black.opacity(0.1), radius: 15, x: 0, y: 8)
                                
                                Image(systemName: "sparkles")
                                    .font(.system(size: 40, weight: .light))
                                    .foregroundColor(.white)
            }
                            
                            // Loading indicator
                            VStack(spacing: 16) {
                                ProgressView()
                                    .scaleEffect(1.2)
                                    .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                                
                                Text("Setting up your AI stylist...")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    
                case .unauthenticated:
                    // User is not authenticated - show onboarding first, then auth
                    if !hasCompletedOnboarding {
                        OnboardingView {
                            hasCompletedOnboarding = true
                            showAuthentication = true
                            authViewId = UUID() // Генерируем новый ID для принудительного пересоздания
                        }
                    } else if showAuthentication {
                        AuthenticationView()
                            .id(authViewId) // Используем уникальный идентификатор
                    } else {
                        LandingPageView {
                            showAuthentication = true
                            authViewId = UUID() // Генерируем новый ID для принудительного пересоздания
                        }
                    }
                }
            }
            .environmentObject(authService)
            .environmentObject(localizationManager)
        }
    }
}
