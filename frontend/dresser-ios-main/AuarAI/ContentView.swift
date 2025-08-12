//
//  ContentView.swift
//  AuarAI
//
//  Created by Bizhan on 01.07.2025.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var authService = AuthenticationService()
    @StateObject private var localizationManager = LocalizationManager.shared
    @State private var showAuthentication = false
    
    var body: some View {
        Group {
            switch authService.authenticationState {
            case .authenticated(let user):
                // User is authenticated - show main dashboard
                DashboardView(user: user, authService: authService)
                
            case .authenticating, .checkingAuth:
                // Show loading state during authentication or initial check
                authenticationLoadingView
                
            case .unauthenticated:
                // User is not authenticated - show landing page or auth
                if showAuthentication {
                    AuthenticationView()
                } else {
                    LandingPageView {
                        showAuthentication = true
                    }
                }
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authService.authenticationState)
        .onChange(of: authService.authenticationState) { newState in
            // Reset authentication view when user signs out
            if case .unauthenticated = newState {
                showAuthentication = false
            }
        }
    }
    
    // MARK: - Authentication Loading View
    private var authenticationLoadingView: some View {
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
                    
                    Text("your_ai_stylist_ready".localized)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
    }
}
        }
    }
}

// MARK: - Preview
#Preview {
    ContentView()
}
