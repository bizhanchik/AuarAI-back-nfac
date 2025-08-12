//
//  OnboardingView.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI

enum Gender: String, CaseIterable {
    case man = "man"
    case woman = "woman"
    
    var icon: String {
        switch self {
        case .man: return "person.fill"
        case .woman: return "person.crop.circle.fill" // Using a different available icon
        }
    }
    
    var localizedName: String {
        switch self {
        case .man: return "onboarding_gender_man".localized
        case .woman: return "onboarding_gender_woman".localized
        }
    }
}

struct OnboardingView: View {
    let onComplete: () -> Void
    @State private var currentPage = 0
    @State private var selectedLanguage: SupportedLanguage? = nil // Убираем автоматический выбор
    @State private var selectedGender: Gender? = nil
    @State private var animateText = false
    @State private var animateBackground = false
    @State private var isPageTransitioning = false
    @State private var isDissolving = false // Новое состояние для анимации растворения
    @Environment(\.colorScheme) var colorScheme
    
    @StateObject private var localizationManager = LocalizationManager.shared
    
    struct Feature {
        let icon: String
        let title: String
        let description: String
    }
    
    private let totalPages = 6
    
    // Features data
    private var features: [Feature] {
        [
            Feature(icon: "tshirt.fill", title: "onboarding_feature_wardrobe_title".localized, description: "onboarding_feature_wardrobe_description".localized),
            Feature(icon: "cloud.sun.fill", title: "onboarding_feature_weather_title".localized, description: "onboarding_feature_weather_description".localized),
            Feature(icon: "lightbulb.fill", title: "onboarding_feature_advice_title".localized, description: "onboarding_feature_advice_description".localized),
            Feature(icon: "sparkles", title: "onboarding_feature_styles_title".localized, description: "onboarding_feature_styles_description".localized)
        ]
    }
    
    // Dynamic colors based on theme
    private var backgroundColor: Color {
        colorScheme == .dark ? Color.black : Color.white
    }
    
    private var primaryTextColor: Color {
        colorScheme == .dark ? Color.white : Color.black
    }
    
    private var secondaryTextColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.8) : Color.black.opacity(0.7)
    }
    
    private var accentColor: Color {
        colorScheme == .dark ? Color.white : Color.black
    }
    
    private var buttonBackgroundColor: Color {
        colorScheme == .dark ? Color.white : Color.black
    }
    
    private var buttonTextColor: Color {
        colorScheme == .dark ? Color.black : Color.white
    }
    
    private var cardBackgroundColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.1) : Color.black.opacity(0.05)
    }
    
    private var borderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.3) : Color.black.opacity(0.2)
    }
    
    var body: some View {
        ZStack {
            // Adaptive background
            backgroundColor
                .ignoresSafeArea()
            
            // Background clothing silhouettes (for page 3)
            if currentPage == 2 {
                backgroundClothingSilhouettes
            }
            
            // Main content
            TabView(selection: $currentPage) {
                // Page 1: Language Selection
                languageSelectionPage
                    .tag(0)
                
                // Page 2: Gender Selection
                genderSelectionPage
                    .tag(1)
                
                // Page 3: Problem Statement
                problemStatementPage
                    .tag(2)
                
                // Page 4: Solution Statement
                solutionStatementPage
                    .tag(3)
                
                // Page 5: Features List
                featuresListPage
                    .tag(4)
                
                // Page 6: Final CTA
                finalCTAPage
                    .tag(5)
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            .animation(.easeInOut(duration: 0.5), value: currentPage)
            
            // Custom page indicator
            VStack {
                Spacer()
                pageIndicator
                    .padding(.bottom, 50)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.6)) {
                animateText = true
                animateBackground = true
            }
        }
        .onChange(of: selectedLanguage) { _ in
            // Обновляем язык в LocalizationManager при изменении
            if let newLanguage = selectedLanguage {
                localizationManager.currentLanguage = newLanguage
            }
        }
        .onChange(of: currentPage) { _ in
            // Сбрасываем анимации при переходе на новую страницу
            isPageTransitioning = true
            animateText = false
            
            // Запускаем анимации для новой страницы с задержкой
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation(.easeInOut(duration: 0.6)) {
                    animateText = true
                    isPageTransitioning = false
                }
            }
        }
    }
    
    // MARK: - Page 1: Language Selection
    private var languageSelectionPage: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // Title
            Text("onboarding_welcome_title".localized)
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(primaryTextColor)
                .multilineTextAlignment(.center)
                .modifier(TitleAnimationModifier(animateText: animateText, delay: 0.2))
            
            // Subtitle
            Text("onboarding_language_title".localized)
                .font(.system(size: 18))
                .foregroundColor(secondaryTextColor)
                .multilineTextAlignment(.center)
                .modifier(SubtitleAnimationModifier(animateText: animateText, delay: 0.4))
            
            // Language options
            VStack(spacing: 16) {
                ForEach(SupportedLanguage.allCases, id: \.self) { language in
                    Button(action: {
                        withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                            selectedLanguage = language
                        }
                    }) {
                        HStack {
                            Text(language.flagEmoji)
                                .font(.system(size: 24))
                            
                            Text(language.displayName)
                                .font(.system(size: 18, weight: .medium))
                                .foregroundColor(selectedLanguage == language ? buttonTextColor : primaryTextColor)
                            
                            Spacer()
                            
                            if selectedLanguage == language {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(buttonTextColor)
                                    .scaleEffect(selectedLanguage == language ? 1.2 : 1.0)
                                    .animation(.spring(response: 0.4, dampingFraction: 0.6), value: selectedLanguage)
                            }
                        }
                        .padding(.horizontal, 24)
                        .padding(.vertical, 16)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(selectedLanguage == language ? buttonBackgroundColor : cardBackgroundColor)
                                .animation(.spring(response: 0.6, dampingFraction: 0.8), value: selectedLanguage)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(borderColor, lineWidth: 1)
                        )
                        .scaleEffect(selectedLanguage == language ? 1.05 : 1.0)
                        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: selectedLanguage)
                    }
                    .modifier(LanguageButtonAnimationModifier(
                        animateText: animateText,
                        language: language
                    ))
                }
            }
            .padding(.horizontal, 40)
            
            Spacer()
            
            // Инструкция для пользователя
            if selectedLanguage != nil {
                Text("Tap anywhere to continue")
                    .font(.system(size: 16))
                    .foregroundColor(secondaryTextColor)
                    .opacity(0.7)
                    .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: animateText)
            }
            
            Spacer()
        }
        .contentShape(Rectangle()) // Делаем всю область тапабельной
        .onTapGesture {
            // Переходим на следующую страницу только если язык выбран
            if selectedLanguage != nil && !isPageTransitioning {
                withAnimation(.easeInOut(duration: 0.5)) {
                    currentPage = 1
                }
            }
        }
    }
    
    // MARK: - Page 2: Gender Selection
    private var genderSelectionPage: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // Title
            Text("onboarding_gender_title".localized)
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(primaryTextColor)
                .multilineTextAlignment(.center)
                .modifier(TitleAnimationModifier(animateText: animateText, delay: 0.2))
            
            // Gender options
            HStack(spacing: 30) {
                ForEach(Gender.allCases, id: \.self) { gender in
                    genderButton(for: gender)
                }
            }
            
            Spacer()
        }
    }
    
    // MARK: - Page 3: Problem Statement
    private var problemStatementPage: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // Icon
            Image(systemName: "questionmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.blue)
                .modifier(IconAnimationModifier(animateText: animateText, rotationDirection: 1))
            
            // Title
            Text("onboarding_problem_title".localized)
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(primaryTextColor)
                .multilineTextAlignment(.center)
                .modifier(TitleAnimationModifier(animateText: animateText, delay: 0.5))
            
            // Description
            Text("onboarding_problem_description".localized)
                .font(.system(size: 18))
                .foregroundColor(secondaryTextColor)
                .multilineTextAlignment(.center)
                .lineLimit(nil)
                .padding(.horizontal, 40)
                .modifier(SubtitleAnimationModifier(animateText: animateText, delay: 0.8))
            
            Spacer()
            
            // Инструкция для пользователя
            Text("Tap anywhere to continue")
                .font(.system(size: 16))
                .foregroundColor(secondaryTextColor)
                .opacity(0.7)
                .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: animateText)
            
            Spacer()
        }
        .contentShape(Rectangle())
        .onTapGesture {
            if !isPageTransitioning {
                withAnimation(.easeInOut(duration: 0.5)) {
                    currentPage = 3
                }
            }
        }
    }
    
    // MARK: - Page 4: Solution Statement
    private var solutionStatementPage: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // Icon
            Image(systemName: "lightbulb.fill")
                .font(.system(size: 80))
                .foregroundColor(.yellow)
                .modifier(IconAnimationModifier(animateText: animateText, rotationDirection: -1))
            
            // Title
            Text("onboarding_solution_title".localized)
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(primaryTextColor)
                .multilineTextAlignment(.center)
                .modifier(TitleAnimationModifier(animateText: animateText, delay: 0.5))
            
            // Description
            Text("onboarding_solution_description".localized)
                .font(.system(size: 18))
                .foregroundColor(secondaryTextColor)
                .multilineTextAlignment(.center)
                .lineLimit(nil)
                .padding(.horizontal, 40)
                .modifier(SubtitleAnimationModifier(animateText: animateText, delay: 0.8))
            
            Spacer()
            
            // Инструкция для пользователя
            Text("Tap anywhere to continue")
                .font(.system(size: 16))
                .foregroundColor(secondaryTextColor)
                .opacity(0.7)
                .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: animateText)
            
            Spacer()
        }
        .contentShape(Rectangle())
        .onTapGesture {
            if !isPageTransitioning {
                withAnimation(.easeInOut(duration: 0.5)) {
                    currentPage = 4
                }
            }
        }
    }
    
    // MARK: - Page 5: Features List
    private var featuresListPage: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // Title
            Text("onboarding_features_title".localized)
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(primaryTextColor)
                .multilineTextAlignment(.center)
                .modifier(TitleAnimationModifier(animateText: animateText, delay: 0.2))
            
            // Features list
            VStack(spacing: 20) {
                ForEach(Array(features.enumerated()), id: \.element.icon) { index, feature in
                    FeatureRow(
                        icon: feature.icon,
                        title: feature.title,
                        description: feature.description,
                        primaryTextColor: primaryTextColor,
                        secondaryTextColor: secondaryTextColor
                    )
                    .modifier(FeatureRowAnimationModifier(
                        animateText: animateText,
                        index: index
                    ))
                }
            }
            .padding(.horizontal, 40)
            
            Spacer()
            
            // Инструкция для пользователя
            Text("Tap anywhere to continue")
                .font(.system(size: 16))
                .foregroundColor(secondaryTextColor)
                .opacity(0.7)
                .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: animateText)
            
            Spacer()
        }
        .contentShape(Rectangle())
        .onTapGesture {
            if !isPageTransitioning {
                withAnimation(.easeInOut(duration: 0.5)) {
                    currentPage = 5
                }
            }
        }
    }
    
    // MARK: - Page 6: Final CTA
    private var finalCTAPage: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // App Icon
            Image(systemName: "sparkles")
                .font(.system(size: 80))
                .foregroundColor(.purple)
                .opacity(isDissolving ? 0 : (animateText ? 1 : 0))
                .offset(y: isDissolving ? -50 : (animateText ? 0 : 60))
                .scaleEffect(isDissolving ? 0.3 : (animateText ? 1 : 0.3))
                .blur(radius: isDissolving ? 15 : (animateText ? 0 : 10))
                .rotationEffect(.degrees(isDissolving ? 180 : (animateText ? 0 : 360)))
                .animation(.easeInOut(duration: 1.2).delay(0.2), value: animateText)
                .animation(.easeInOut(duration: 1.5), value: isDissolving)
            
            // Title
            Text("onboarding_final_title".localized)
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(primaryTextColor)
                .multilineTextAlignment(.center)
                .opacity(isDissolving ? 0 : (animateText ? 1 : 0))
                .offset(y: isDissolving ? -30 : (animateText ? 0 : 40))
                .scaleEffect(isDissolving ? 0.5 : (animateText ? 1 : 0.8))
                .blur(radius: isDissolving ? 10 : (animateText ? 0 : 8))
                .animation(.easeInOut(duration: 0.9).delay(0.5), value: animateText)
                .animation(.easeInOut(duration: 1.5).delay(0.1), value: isDissolving)
            
            // Description
            Text("onboarding_final_description".localized)
                .font(.system(size: 18))
                .foregroundColor(secondaryTextColor)
                .multilineTextAlignment(.center)
                .lineLimit(nil)
                .opacity(isDissolving ? 0 : (animateText ? 1 : 0))
                .offset(y: isDissolving ? -20 : (animateText ? 0 : 30))
                .scaleEffect(isDissolving ? 0.7 : (animateText ? 1 : 0.9))
                .blur(radius: isDissolving ? 8 : (animateText ? 0 : 5))
                .animation(.easeInOut(duration: 0.8).delay(0.8), value: animateText)
                .animation(.easeInOut(duration: 1.5).delay(0.2), value: isDissolving)
            
            Spacer()
            
            // Get Started button
            Button(action: {
                // Завершаем онбординг без показа экрана фото тела
                onComplete()
            }) {
                Text("onboarding_get_started".localized)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(buttonTextColor)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(buttonBackgroundColor)
                    )
            }
            .padding(.horizontal, 40)
            .opacity(isDissolving ? 0 : (animateText ? 1 : 0))
            .offset(y: isDissolving ? 30 : (animateText ? 0 : 50))
            .scaleEffect(isDissolving ? 0.8 : (animateText ? 1 : 0.7))
            .blur(radius: isDissolving ? 5 : (animateText ? 0 : 8))
            .rotationEffect(.degrees(isDissolving ? 0 : (animateText ? 0 : 10)))
            .animation(.easeInOut(duration: 0.8).delay(1.1), value: animateText)
            .animation(.easeInOut(duration: 1.5).delay(0.3), value: isDissolving)
            
            Spacer()
        }
        .padding(.horizontal, 40)
    }
    
    // MARK: - Background Clothing Silhouettes
    private var backgroundClothingSilhouettes: some View {
        ZStack {
            // Scattered clothing icons as background
            ForEach(0..<15, id: \.self) { index in
                Image(systemName: clothingIcons.randomElement() ?? "tshirt.fill")
                    .font(.system(size: CGFloat.random(in: 40...80)))
                    .foregroundColor(secondaryTextColor.opacity(0.1))
                    .position(
                        x: CGFloat.random(in: 0...UIScreen.main.bounds.width),
                        y: CGFloat.random(in: 0...UIScreen.main.bounds.height)
                    )
                    .opacity(isDissolving ? 0 : (animateBackground ? 0.05 : 0))
                    .scaleEffect(isDissolving ? 0.3 : 1)
                    .rotationEffect(.degrees(isDissolving ? Double.random(in: -360...360) : 0))
                    .blur(radius: isDissolving ? 15 : 0)
                    .animation(.easeInOut(duration: 2).delay(Double(index) * 0.1), value: animateBackground)
                    .animation(.easeInOut(duration: 1.5).delay(Double(index) * 0.05), value: isDissolving)
            }
        }
    }
    
    private let clothingIcons = [
        "tshirt.fill", "handbag.fill", "shoe.fill", "eyeglasses",
        "crown.fill", "heart.fill", "star.fill", "sparkles"
    ]
    
    // MARK: - Page Indicator
    private var pageIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<totalPages, id: \.self) { index in
                Circle()
                    .fill(index == currentPage ? primaryTextColor : secondaryTextColor.opacity(0.3))
                    .frame(width: 8, height: 8)
                    .scaleEffect(isDissolving ? 0 : (index == currentPage ? 1.2 : 1.0))
                    .opacity(isDissolving ? 0 : 1)
                    .blur(radius: isDissolving ? 3 : 0)
                    .animation(.easeInOut(duration: 0.3), value: currentPage)
                    .animation(.easeInOut(duration: 1.5).delay(0.4), value: isDissolving)
            }
        }
    }
    
    // MARK: - Helper Functions
    private func genderButton(for gender: Gender) -> some View {
        Button(action: {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                selectedGender = gender
            }
            
            // Автоматический переход на следующую страницу после выбора пола
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                if !isPageTransitioning {
                    withAnimation(.easeInOut(duration: 0.5)) {
                        currentPage = 2
                    }
                }
            }
        }) {
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(selectedGender == gender ? buttonBackgroundColor : cardBackgroundColor)
                        .frame(width: 80, height: 80)
                        .overlay(
                            Circle()
                                .stroke(selectedGender == gender ? buttonBackgroundColor : borderColor, lineWidth: selectedGender == gender ? 3 : 2)
                        )
                    
                    Image(systemName: gender.icon)
                        .font(.system(size: 32))
                        .foregroundColor(selectedGender == gender ? .white : primaryTextColor)
                }
                
                Text(gender.localizedName)
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(selectedGender == gender ? buttonBackgroundColor : primaryTextColor)
            }
        }
        .scaleEffect(selectedGender == gender ? 1.05 : 1.0)
        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: selectedGender)
        .modifier(GenderButtonAnimationModifier(
            animateText: animateText,
            gender: gender
        ))
    }
}

// MARK: - Feature Row Component
struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    let primaryTextColor: Color
    let secondaryTextColor: Color
    
    var body: some View {
        HStack(spacing: 16) {
            // Icon
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(primaryTextColor)
                .frame(width: 30)
            
            // Text content
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(primaryTextColor)
                
                Text(description)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(secondaryTextColor)
            }
            
            Spacer()
        }
    }
}

// MARK: - Preview
struct OnboardingView_Previews: PreviewProvider {
    static var previews: some View {
        OnboardingView {
            print("Onboarding completed")
        }
    }
}

// MARK: - Custom ViewModifiers
struct TitleAnimationModifier: ViewModifier {
    let animateText: Bool
    let delay: Double
    
    func body(content: Content) -> some View {
        content
            .opacity(animateText ? 1 : 0)
            .offset(y: animateText ? 0 : 30)
            .scaleEffect(animateText ? 1 : 0.9)
            .blur(radius: animateText ? 0 : 5)
            .animation(.easeInOut(duration: 0.8).delay(delay), value: animateText)
    }
}

struct SubtitleAnimationModifier: ViewModifier {
    let animateText: Bool
    let delay: Double
    
    func body(content: Content) -> some View {
        content
            .opacity(animateText ? 1 : 0)
            .offset(y: animateText ? 0 : 25)
            .scaleEffect(animateText ? 1 : 0.95)
            .blur(radius: animateText ? 0 : 3)
            .animation(.easeInOut(duration: 0.8).delay(delay), value: animateText)
    }
}

struct GenderButtonAnimationModifier: ViewModifier {
    let animateText: Bool
    let gender: Gender
    
    func body(content: Content) -> some View {
        content
            .opacity(animateText ? 1 : 0)
            .offset(y: animateText ? 0 : 40)
            .scaleEffect(animateText ? 1 : 0.7)
            .blur(radius: animateText ? 0 : 3)
            .rotationEffect(.degrees(animateText ? 0 : (Gender.allCases.firstIndex(of: gender) == 0 ? -10 : 10)))
            .animation(.easeInOut(duration: 0.7).delay(0.4 + Double(Gender.allCases.firstIndex(of: gender) ?? 0) * 0.2), value: animateText)
    }
}

struct IconAnimationModifier: ViewModifier {
    let animateText: Bool
    let rotationDirection: Double // 1 для по часовой, -1 для против часовой
    
    func body(content: Content) -> some View {
        content
            .opacity(animateText ? 1 : 0)
            .offset(y: animateText ? 0 : 50)
            .scaleEffect(animateText ? 1 : 0.5)
            .blur(radius: animateText ? 0 : 8)
            .rotationEffect(.degrees(animateText ? 0 : 180 * rotationDirection))
            .animation(.easeInOut(duration: 1.0).delay(0.2), value: animateText)
    }
}

struct FeatureRowAnimationModifier: ViewModifier {
    let animateText: Bool
    let index: Int
    
    func body(content: Content) -> some View {
        content
            .opacity(animateText ? 1 : 0)
            .offset(x: animateText ? 0 : (index % 2 == 0 ? -60 : 60), y: animateText ? 0 : 30)
            .scaleEffect(animateText ? 1 : 0.8)
            .blur(radius: animateText ? 0 : 3)
            .rotationEffect(.degrees(animateText ? 0 : (index % 2 == 0 ? -5 : 5)))
            .animation(.easeInOut(duration: 0.7).delay(0.4 + Double(index) * 0.15), value: animateText)
    }
}

struct LanguageButtonAnimationModifier: ViewModifier {
    let animateText: Bool
    let language: SupportedLanguage
    
    func body(content: Content) -> some View {
        content
            .opacity(animateText ? 1 : 0)
            .offset(x: animateText ? 0 : -50, y: animateText ? 0 : 20)
            .scaleEffect(animateText ? 1 : 0.8)
            .blur(radius: animateText ? 0 : 2)
            .rotationEffect(.degrees(animateText ? 0 : -5))
            .animation(.easeInOut(duration: 0.6).delay(0.6 + Double(SupportedLanguage.allCases.firstIndex(of: language) ?? 0) * 0.15), value: animateText)
    }
}