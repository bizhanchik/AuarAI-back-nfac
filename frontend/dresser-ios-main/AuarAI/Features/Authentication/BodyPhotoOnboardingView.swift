//
//  BodyPhotoOnboardingView.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI
import UIKit
import FirebaseAuth



struct BodyPhotoOnboardingView: View {
    let onComplete: () -> Void
    
    @StateObject private var photoPickerService = PhotoPickerService()
    @StateObject private var bodyAnalysisService = BodyAnalysisService()
    @State private var currentStep = 0
    @State private var showCamera = false
    @State private var showPhotoLibrary = false
    @State private var animateElements = false
    @State private var isAnalyzing = false
    @State private var showError = false
    @State private var errorMessage = ""

    
    @Environment(\.colorScheme) var colorScheme
    
    private let totalSteps = 3
    
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
    
    private var buttonBackgroundColor: Color {
        colorScheme == .dark ? Color.white : Color.black
    }
    
    private var buttonTextColor: Color {
        colorScheme == .dark ? Color.black : Color.white
    }
    
    private var cardBackgroundColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.1) : Color.black.opacity(0.05)
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                backgroundColor
                    .ignoresSafeArea(.all)
                
                mainContentView
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
        }
        .ignoresSafeArea(.all)
        .onAppear {
            withAnimation(.easeInOut(duration: 0.6)) {
                animateElements = true
            }
        }
        .alert("Ошибка", isPresented: $showError) {
            Button("OK") {
                showError = false
            }
        } message: {
            Text(errorMessage)
        }
        .sheet(isPresented: $showCamera) {
            CameraPickerCoordinator(isPresented: $showCamera) { image in
                photoPickerService.addImageFromCamera(image)
                showCamera = false
                // Automatically start analysis after photo capture
                analyzeBodyPhoto()
            }
        }
        .sheet(isPresented: $showPhotoLibrary) {
            PhotoLibraryPickerCoordinator(isPresented: $showPhotoLibrary) { image in
                photoPickerService.addImageFromPhotoLibrary(image)
                showPhotoLibrary = false
                // Automatically start analysis after photo selection
                analyzeBodyPhoto()
            }
        }
    }
    
    private var mainContentView: some View {
        VStack(spacing: 0) {
            // Progress indicator
            progressIndicator
                .padding(.top, 20)
            
            // Main content
            TabView(selection: $currentStep) {
                // Step 1: Introduction
                introductionStep
                    .tag(0)
                
                // Step 2: Photo capture
                photoCaptureStep
                    .tag(1)
                
                // Step 3: Analysis results
                analysisResultsStep
                    .tag(2)
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            .animation(.easeInOut(duration: 0.5), value: currentStep)
        }
    }
    

    
    // MARK: - Progress Indicator
    private var progressIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<totalSteps, id: \.self) { index in
                Circle()
                    .fill(index <= currentStep ? Color.blue : Color.gray.opacity(0.3))
                    .frame(width: 10, height: 10)
                    .scaleEffect(index == currentStep ? 1.2 : 1.0)
                    .animation(.easeInOut(duration: 0.3), value: currentStep)
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Step 1: Introduction
    private var introductionStep: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // Icon
            Image(systemName: "person.fill.viewfinder")
                .font(.system(size: 80))
                .foregroundColor(.blue)
                .opacity(animateElements ? 1 : 0)
                .scaleEffect(animateElements ? 1 : 0.5)
                .animation(.easeInOut(duration: 0.8).delay(0.2), value: animateElements)
            
            // Title
            Text("Фото в полный рост")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(primaryTextColor)
                .multilineTextAlignment(.center)
                .opacity(animateElements ? 1 : 0)
                .offset(y: animateElements ? 0 : 30)
                .animation(.easeInOut(duration: 0.8).delay(0.4), value: animateElements)
            
            // Description
            VStack(spacing: 16) {
                Text("Для персональных рекомендаций нам нужно ваше фото в полный рост")
                    .font(.system(size: 18))
                    .foregroundColor(secondaryTextColor)
                    .multilineTextAlignment(.center)
                    .opacity(animateElements ? 1 : 0)
                    .offset(y: animateElements ? 0 : 20)
                    .animation(.easeInOut(duration: 0.8).delay(0.6), value: animateElements)
                
                Text("Мы проанализируем:")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(primaryTextColor)
                    .opacity(animateElements ? 1 : 0)
                    .offset(y: animateElements ? 0 : 20)
                    .animation(.easeInOut(duration: 0.8).delay(0.8), value: animateElements)
                
                VStack(alignment: .leading, spacing: 8) {
                    analysisFeature(icon: "paintpalette.fill", text: "Подходящие цвета для вашего типа внешности")
                    analysisFeature(icon: "ruler.fill", text: "Лучшие фасоны для вашего телосложения")
                    analysisFeature(icon: "figure.walk", text: "Пропорции тела и длину ног")
                    analysisFeature(icon: "sparkles", text: "Персональные стилевые рекомендации")
                }
                .opacity(animateElements ? 1 : 0)
                .offset(y: animateElements ? 0 : 20)
                .animation(.easeInOut(duration: 0.8).delay(1.0), value: animateElements)
            }
            .padding(.horizontal, 30)
            
            Spacer()
            
            Button(action: {
                withAnimation(.easeInOut(duration: 0.5)) {
                    currentStep = 1
                }
            }) {
                Text("Продолжить")
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
            .opacity(animateElements ? 1 : 0)
            .offset(y: animateElements ? 0 : 30)
            .animation(.easeInOut(duration: 0.8).delay(1.2), value: animateElements)
            
            Spacer()
        }
    }
    
    // MARK: - Step 2: Photo Capture
    private var photoCaptureStep: some View {
        VStack(spacing: 30) {
            Spacer()
            
            if photoPickerService.selectedImages.isEmpty {
                // Photo capture options
                VStack(spacing: 30) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)
                    
                    Text("Сделайте фото в полный рост")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(primaryTextColor)
                        .multilineTextAlignment(.center)
                    
                    Text("Встаньте прямо, руки по швам, в хорошо освещенном месте")
                        .font(.system(size: 16))
                        .foregroundColor(secondaryTextColor)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 30)
                    
                    // Photo source buttons
                    VStack(spacing: 16) {
                        Button(action: {
                            showCamera = true
                        }) {
                            HStack(spacing: 16) {
                                Image(systemName: "camera.fill")
                                    .font(.title2)
                                    .foregroundColor(.blue)
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Сделать фото")
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(primaryTextColor)
                                    
                                    Text("Использовать камеру")
                                        .font(.system(size: 14))
                                        .foregroundColor(secondaryTextColor)
                                }
                                
                                Spacer()
                                
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14))
                                    .foregroundColor(secondaryTextColor)
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 16)
                            .background(cardBackgroundColor)
                            .cornerRadius(12)
                        }
                        
                        Button(action: {
                            showPhotoLibrary = true
                        }) {
                            HStack(spacing: 16) {
                                Image(systemName: "photo.fill")
                                    .font(.title2)
                                    .foregroundColor(.green)
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Выбрать из галереи")
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(primaryTextColor)
                                    
                                    Text("Использовать существующее фото")
                                        .font(.system(size: 14))
                                        .foregroundColor(secondaryTextColor)
                                }
                                
                                Spacer()
                                
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14))
                                    .foregroundColor(secondaryTextColor)
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 16)
                            .background(cardBackgroundColor)
                            .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal, 40)
                }
            } else if isAnalyzing {
                // Analysis in progress
                VStack(spacing: 20) {
                    ProgressView()
                        .scaleEffect(1.5)
                        .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                    
                    Text("Анализируем ваше фото...")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(primaryTextColor)
                    
                    Text("Это может занять несколько секунд")
                        .font(.system(size: 14))
                        .foregroundColor(secondaryTextColor)
                }
            } else {
                // Photo selected, show preview (this case should not occur as analysis starts automatically)
                VStack(spacing: 20) {
                    Image(uiImage: photoPickerService.selectedImages.first!)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxHeight: 300)
                        .cornerRadius(12)
                        .shadow(radius: 5)
                    
                    Text("Отличное фото!")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(primaryTextColor)
                    
                    Button("Переснять") {
                        photoPickerService.clearSelection()
                    }
                    .foregroundColor(.blue)
                }
                .padding(.horizontal, 40)
            }
            
            Spacer()
        }
    }
    
    // MARK: - Step 3: Analysis Results
    private var analysisResultsStep: some View {
        VStack(spacing: 30) {
            ScrollView{
                Spacer()
                
                if let results = bodyAnalysisService.analysisResults {
                    VStack(spacing: 20) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.green)
                        
                        Text("Анализ завершен!")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(primaryTextColor)
                        
                        Text("Мы проанализировали ваше фото и готовы дать персональные рекомендации")
                            .font(.system(size: 16))
                            .foregroundColor(secondaryTextColor)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 30)
                        
                        // Results preview
                        VStack(spacing: 12) {
                            if let bodyType = results.bodyType {
                                resultRow(icon: "figure.walk", title: "Тип телосложения", value: bodyType)
                            }
                            
                            if let styleRecommendation = results.styleRecommendations?.first {
                                resultRow(icon: "sparkles", title: "Стилевые рекомендации", value: styleRecommendation)
                            }
                            
                            // Recommended Colors Section
                            if let recommendedColors = results.recommendedColors, !recommendedColors.isEmpty {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack(spacing: 12) {
                                        Image(systemName: "paintpalette.fill")
                                            .font(.system(size: 16))
                                            .foregroundColor(.blue)
                                            .frame(width: 20)
                                        
                                        Text("Рекомендуемые цвета")
                                            .font(.system(size: 14, weight: .medium))
                                            .foregroundColor(primaryTextColor)
                                        
                                        Spacer()
                                    }
                                    
                                    ScrollView(.horizontal, showsIndicators: false) {
                                        HStack(alignment: .top, spacing: 12) {
                                            ForEach(recommendedColors, id: \.self) { colorName in
                                                VStack(spacing: 6) {
                                                    Circle()
                                                        .fill(colorFromName(colorName))
                                                        .frame(width: 40, height: 40)
                                                        .overlay(
                                                            Circle()
                                                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                                                        )
                                                    
                                                    Text(colorName)
                                                        .font(.system(size: 10, weight: .medium))
                                                        .foregroundColor(secondaryTextColor)
                                                        .multilineTextAlignment(.center)
                                                        .frame(width: 50, height: 24)
                                                        .fixedSize(horizontal: false, vertical: true)
                                                }
                                            }
                                        }
                                        .padding(.horizontal, 16)
                                    }
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 12)
                                .background(cardBackgroundColor)
                                .cornerRadius(8)
                            }
                        }
                    .padding(.horizontal, 30)
                }
            } else {
                    VStack(spacing: 20) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.orange)
                        
                        Text("Что-то пошло не так")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(primaryTextColor)
                        
                        Text("Попробуйте еще раз или обратитесь в поддержку")
                            .font(.system(size: 16))
                            .foregroundColor(secondaryTextColor)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 30)
                    }
                }
                
                Spacer()
                
                // Complete button
                Button(action: {
                    onComplete()
                }) {
                    Text("Завершить настройку")
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
                
                Spacer()
            }
        }
    }
    
    // MARK: - Helper Views
    private func analysisFeature(icon: String, text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(.blue)
                .frame(width: 20)
            
            Text(text)
                .font(.system(size: 14))
                .foregroundColor(secondaryTextColor)
            
            Spacer()
        }
    }
    
    private func resultRow(icon: String, title: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(.blue)
                .frame(width: 20)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(primaryTextColor)
                
                Text(value)
                    .font(.system(size: 12))
                    .foregroundColor(secondaryTextColor)
            }
            
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(cardBackgroundColor)
        .cornerRadius(8)
    }
    
    // Helper function to convert color name to SwiftUI Color
    private func colorFromName(_ colorName: String) -> Color {
        let lowercasedColor = colorName.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        switch lowercasedColor {
        case "красный", "red":
            return .red
        case "синий", "blue":
            return .blue
        case "зеленый", "green":
            return .green
        case "желтый", "yellow":
            return .yellow
        case "оранжевый", "orange":
            return .orange
        case "фиолетовый", "purple":
            return .purple
        case "розовый", "pink":
            return .pink
        case "коричневый", "brown":
            return .brown
        case "серый", "gray", "grey":
            return .gray
        case "черный", "black":
            return .black
        case "белый", "white":
            return .white
        case "бежевый", "beige":
            return Color(red: 0.96, green: 0.96, blue: 0.86)
        case "темно-синий", "navy", "navy blue", "dark blue":
            return Color(red: 0.0, green: 0.0, blue: 0.5)
        case "бордовый", "maroon":
            return Color(red: 0.5, green: 0.0, blue: 0.0)
        case "хаки", "khaki":
            return Color(red: 0.94, green: 0.9, blue: 0.55)
        case "мятный", "mint":
            return Color(red: 0.6, green: 1.0, blue: 0.6)
        case "лавандовый", "lavender":
            return Color(red: 0.9, green: 0.9, blue: 0.98)
        case "персиковый", "peach":
            return Color(red: 1.0, green: 0.85, blue: 0.73)
        case "золотой", "gold":
            return Color(red: 1.0, green: 0.84, blue: 0.0)
        case "серебряный", "silver":
            return Color(red: 0.75, green: 0.75, blue: 0.75)
        case "бирюзовый", "turquoise":
            return Color(red: 0.25, green: 0.88, blue: 0.82)
        case "коралловый", "coral":
            return Color(red: 1.0, green: 0.5, blue: 0.31)
        case "olive green", "оливковый":
            return Color(red: 0.5, green: 0.5, blue: 0.0)
        case "charcoal grey", "угольно-серый":
            return Color(red: 0.21, green: 0.27, blue: 0.31)
        case "burgundy", "бургунди":
            return Color(red: 0.5, green: 0.0, blue: 0.13)
        case "deep teal", "глубокий бирюзовый":
            return Color(red: 0.0, green: 0.5, blue: 0.5)
        default:
            // Try to parse hex colors if they start with #
            if colorName.hasPrefix("#") {
                return colorFromHex(colorName) ?? .gray
            }
            return .gray
        }
    }
    
    // Helper function to parse hex colors
    private func colorFromHex(_ hex: String) -> Color? {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            return nil
        }

        return Color(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
    
    // MARK: - Helper Functions
    private func analyzeBodyPhoto() {
        guard let image = photoPickerService.selectedImages.first else { return }
        
        isAnalyzing = true
        
        Task {
            do {
                try await bodyAnalysisService.analyzeBodyPhoto(image)
                
                await MainActor.run {
                    isAnalyzing = false
                    withAnimation(.easeInOut(duration: 0.5)) {
                        currentStep = 2
                    }
                }
            } catch {
                await MainActor.run {
                    isAnalyzing = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}

// MARK: - Body Analysis Service
@MainActor
class BodyAnalysisService: ObservableObject {
    @Published var analysisResults: BodyAnalysisResult?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func analyzeBodyPhoto(_ image: UIImage) async throws {
        isLoading = true
        defer { isLoading = false }
        
        // Convert image to data with adaptive compression
        var imageData: Data?
        var compressionQuality: CGFloat = 0.9
        
        // Try different compression levels to ensure the image can be processed
        while compressionQuality > 0.1 && imageData == nil {
            imageData = image.jpegData(compressionQuality: compressionQuality)
            if let data = imageData, data.count > 10 * 1024 * 1024 { // If larger than 10MB
                imageData = nil
                compressionQuality -= 0.1
            } else {
                break
            }
        }
        
        // If still no data, try with minimal compression
        if imageData == nil {
            imageData = image.jpegData(compressionQuality: 0.1)
        }
        
        guard let finalImageData = imageData else {
            throw BodyAnalysisError.imageProcessingFailed
        }
        
        // Create multipart form data
        let boundary = UUID().uuidString
        var body = Data()
        
        // Add image data
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"body_photo.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(finalImageData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        
        // Create request
        guard let url = URL(string: "\(APIConfig.baseURL)/body-analysis/analyze") else {
            throw BodyAnalysisError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        
        // Add authentication if available
        if let user = Auth.auth().currentUser {
            do {
                let token = try await user.getIDToken()
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            } catch {
                print("Failed to get Firebase token: \(error)")
            }
        }
        
        // Perform request
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw BodyAnalysisError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw BodyAnalysisError.serverErrorCode(httpResponse.statusCode)
        }
        
        // Parse response
        let decoder = JSONDecoder()
        let analysisResponse = try decoder.decode(BodyAnalysisAPIResponse.self, from: data)
        
        // Check if the response indicates success
        guard analysisResponse.success else {
            throw BodyAnalysisError.serverErrorMessage(analysisResponse.message ?? "Unknown error")
        }
        
        // Extract the result from the response
        if let result = analysisResponse.result {
            self.analysisResults = result
            // Инвалидируем кэш при обновлении анализа тела
            WardrobeCompatibilityCache.shared.invalidateCacheForBodyAnalysisChange()
        } else {
            throw BodyAnalysisError.invalidResponse
        }
    }
}

// MARK: - Data Models
struct BodyAnalysisAPIResponse: Codable {
    let success: Bool
    let message: String?
    let result: BodyAnalysisResult?
    let photo_url: String?
}

struct BodyAnalysisResult: Codable {
    let bodyType: String?
    let recommendedColors: [String]?
    let styleRecommendations: [String]?
    let proportions: BodyProportions?
    let confidence: Double?
}

struct BodyProportions: Codable {
    let legToBodyRatio: Double?
    let shoulderToHipRatio: Double?
    let waistToHipRatio: Double?
}

enum BodyAnalysisError: LocalizedError {
    case imageProcessingFailed
    case invalidURL
    case invalidResponse
    case serverErrorCode(Int)
    case serverErrorMessage(String)
    
    var errorDescription: String? {
        switch self {
        case .imageProcessingFailed:
            return "Не удалось обработать изображение"
        case .invalidURL:
            return "Неверный URL"
        case .invalidResponse:
            return "Неверный ответ сервера"
        case .serverErrorCode(let code):
            return "Ошибка сервера: \(code)"
        case .serverErrorMessage(let message):
            return "Ошибка сервера: \(message)"
        }
    }
}

// MARK: - API Config
struct APIConfig {
    static let baseURL = "https://auarai.com/api" // Production URL
    // For local development, use: "http://localhost:8000"
}

// MARK: - Preview
struct BodyPhotoOnboardingView_Previews: PreviewProvider {
    static var previews: some View {
        BodyPhotoOnboardingView {
            print("Body photo onboarding completed")
        }
    }
}
