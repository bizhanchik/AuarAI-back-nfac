//
//  AuthenticationView.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI

struct AuthenticationView: View {
    @StateObject private var authService = AuthenticationService()
    @StateObject private var localizationManager = LocalizationManager.shared
    @State private var showError = false
    @State private var animateElements = false
    @State private var animateBackground = false
    
    var body: some View {
        NavigationView {
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
                .scaleEffect(animateBackground ? 1.0 : 1.1)
                .opacity(animateBackground ? 1.0 : 0.8)
                .animation(.easeInOut(duration: 1.2), value: animateBackground)
                
                VStack(spacing: 0) {
                    // Header Section
                    headerSection
                    
                    Spacer()
                    
                    // Sign In Section
                    signInSection
                    
                    Spacer()
                    
                    // Footer
                    footerSection
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 40)
            }
        }
        .alert("authentication_error".localized, isPresented: $showError) {
            Button("ok".localized) {
                showError = false
                authService.errorMessage = nil
            }
        } message: {
            Text(authService.errorMessage ?? "unknown_error".localized)
        }
        .onChange(of: authService.errorMessage) { newValue in
            showError = newValue != nil
        }
        .onAppear {
            // Сбрасываем анимации
            animateElements = false
            animateBackground = false
            
            // Запускаем анимации с небольшой задержкой для лучшего эффекта
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                withAnimation(.easeInOut(duration: 1.0)) {
                    animateBackground = true
                }
                
                withAnimation(.easeInOut(duration: 0.8).delay(0.1)) {
                    animateElements = true
                }
            }
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
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
                    .scaleEffect(animateElements ? 1.0 : 0.3)
                    .opacity(animateElements ? 1.0 : 0)
                    .rotationEffect(.degrees(animateElements ? 0 : 180))
                    .animation(.easeInOut(duration: 1.0).delay(0.2), value: animateElements)
                
                Image(systemName: "sparkles")
                    .font(.system(size: 40, weight: .light))
                    .foregroundColor(.white)
                    .scaleEffect(animateElements ? 1.0 : 0.5)
                    .opacity(animateElements ? 1.0 : 0)
                    .rotationEffect(.degrees(animateElements ? 0 : -180))
                    .animation(.easeInOut(duration: 1.2).delay(0.5), value: animateElements)
            }
            
            // Title and Subtitle
            VStack(spacing: 12) {
                Text("welcome_to_auarai".localized)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .modifier(AuthTitleAnimationModifier(animateElements: animateElements, delay: 0.8))
                
                Text("sign_in_description".localized)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .lineLimit(nil)
                    .modifier(AuthSubtitleAnimationModifier(animateElements: animateElements, delay: 1.1))
            }
        }
    }
    
    // MARK: - Sign In Section
    private var signInSection: some View {
        VStack(spacing: 24) {
            // Loading State
            if authService.isLoading {
                VStack(spacing: 16) {
                    ProgressView()
                        .scaleEffect(1.2)
                        .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                        .scaleEffect(animateElements ? 1.2 : 0.8)
                        .opacity(animateElements ? 1.0 : 0.7)
                        .animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true), value: animateElements)
                    
                    Text("signing_in".localized)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .opacity(animateElements ? 1.0 : 0)
                        .offset(y: animateElements ? 0 : 10)
                        .animation(.easeInOut(duration: 0.8).delay(0.3), value: animateElements)
                }
                .frame(height: 100)
            } else {
                VStack(spacing: 16) {
                    // Sign in with Apple Button
                    signInWithAppleButton
                        .modifier(AuthButtonAnimationModifier(animateElements: animateElements, delay: 1.4, direction: -1))
                    
                    // Divider
                    HStack {
                        Rectangle()
                            .fill(Color(.systemGray5))
                            .frame(height: 1)
                        
                        Text("or".localized)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 12)
                        
                        Rectangle()
                            .fill(Color(.systemGray5))
                            .frame(height: 1)
                    }
                    .modifier(AuthDividerAnimationModifier(animateElements: animateElements, delay: 1.7))
                    
                    // Google Sign-In Button
                    googleSignInButton
                        .modifier(AuthButtonAnimationModifier(animateElements: animateElements, delay: 2.0, direction: 1))
                }
            }
        }
    }
    
    // MARK: - Sign in with Apple Button
    private var signInWithAppleButton: some View {
        Button {
            authService.signInWithApple()
        } label: {
            HStack(spacing: 16) {
                // Apple Icon
                Image(systemName: "applelogo")
                    .font(.system(size: 20))
                    .foregroundColor(.white)
                
                Text("continue_with_apple".localized)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(Color.black)
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
        }
        .buttonStyle(.plain)
        .disabled(authService.isLoading)
    }
    
    // MARK: - Google Sign-In Button
    private var googleSignInButton: some View {
        Button {
            Task {
                await authService.signInWithGoogle()
            }
        } label: {
            HStack(spacing: 16) {
                // Google Icon (using SF Symbol as placeholder)
                Image(systemName: "globe")
                    .font(.system(size: 20))
                    .foregroundColor(.primary)
                
                Text("continue_with_google".localized)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(Color(.systemBackground))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color(.systemGray4), lineWidth: 1)
            )
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
        }
        .buttonStyle(.plain)
        .disabled(authService.isLoading)
    }
    
    // MARK: - Footer Section
    private var footerSection: some View {
        VStack(spacing: 16) {
            // Privacy Notice
            Text("privacy_notice".localized)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .modifier(AuthFooterTextAnimationModifier(animateElements: animateElements, delay: 2.3))
            
            // Decorative Element
            HStack {
                Rectangle()
                    .fill(Color(.systemGray5))
                    .frame(height: 1)
                
                Image(systemName: "sparkles")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Rectangle()
                    .fill(Color(.systemGray5))
                    .frame(height: 1)
            }
            .modifier(AuthFooterDecorationAnimationModifier(animateElements: animateElements, delay: 2.6))
        }
    }
}

// MARK: - Preview
#Preview {
    AuthenticationView()
}

// MARK: - Custom Animation Modifiers for Authentication
struct AuthTitleAnimationModifier: ViewModifier {
    let animateElements: Bool
    let delay: Double
    
    func body(content: Content) -> some View {
        content
            .opacity(animateElements ? 1 : 0)
            .offset(y: animateElements ? 0 : 30)
            .scaleEffect(animateElements ? 1 : 0.9)
            .blur(radius: animateElements ? 0 : 5)
            .animation(.easeInOut(duration: 0.8).delay(delay), value: animateElements)
    }
}

struct AuthSubtitleAnimationModifier: ViewModifier {
    let animateElements: Bool
    let delay: Double
    
    func body(content: Content) -> some View {
        content
            .opacity(animateElements ? 1 : 0)
            .offset(y: animateElements ? 0 : 25)
            .scaleEffect(animateElements ? 1 : 0.95)
            .blur(radius: animateElements ? 0 : 3)
            .animation(.easeInOut(duration: 0.8).delay(delay), value: animateElements)
    }
}

struct AuthButtonAnimationModifier: ViewModifier {
    let animateElements: Bool
    let delay: Double
    let direction: Double // -1 для левой стороны, 1 для правой
    
    func body(content: Content) -> some View {
        content
            .opacity(animateElements ? 1 : 0)
            .offset(x: animateElements ? 0 : (50 * direction), y: animateElements ? 0 : 30)
            .scaleEffect(animateElements ? 1 : 0.8)
            .blur(radius: animateElements ? 0 : 3)
            .rotationEffect(.degrees(animateElements ? 0 : (5 * direction)))
            .animation(.easeInOut(duration: 0.7).delay(delay), value: animateElements)
    }
}

struct AuthDividerAnimationModifier: ViewModifier {
    let animateElements: Bool
    let delay: Double
    
    func body(content: Content) -> some View {
        content
            .opacity(animateElements ? 1 : 0)
            .scaleEffect(x: animateElements ? 1 : 0.3, y: animateElements ? 1 : 0.8)
            .blur(radius: animateElements ? 0 : 2)
            .animation(.easeInOut(duration: 0.6).delay(delay), value: animateElements)
    }
}

struct AuthFooterTextAnimationModifier: ViewModifier {
    let animateElements: Bool
    let delay: Double
    
    func body(content: Content) -> some View {
        content
            .opacity(animateElements ? 1 : 0)
            .offset(y: animateElements ? 0 : 20)
            .scaleEffect(animateElements ? 1 : 0.9)
            .blur(radius: animateElements ? 0 : 2)
            .animation(.easeInOut(duration: 0.6).delay(delay), value: animateElements)
    }
}

struct AuthFooterDecorationAnimationModifier: ViewModifier {
    let animateElements: Bool
    let delay: Double
    
    func body(content: Content) -> some View {
        content
            .opacity(animateElements ? 1 : 0)
            .scaleEffect(x: animateElements ? 1 : 0.1, y: animateElements ? 1 : 0.5)
            .blur(radius: animateElements ? 0 : 3)
            .rotationEffect(.degrees(animateElements ? 0 : 180))
            .animation(.easeInOut(duration: 0.8).delay(delay), value: animateElements)
    }
}