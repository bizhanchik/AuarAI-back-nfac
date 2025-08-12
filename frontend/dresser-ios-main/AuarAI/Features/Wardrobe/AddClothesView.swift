//
//  AddClothesView.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI

struct AddClothesView: View {
    
    // MARK: - Environment
    @Environment(\.dismiss) private var dismiss
    
    // MARK: - State Objects
    @StateObject private var photoPickerService = PhotoPickerService()
    @StateObject private var clothingService = ClothingService()
    @StateObject private var localizationManager = LocalizationManager.shared
    
    // MARK: - State Variables
    @State private var currentStep: AddClothesStep = .photoSelection
    @State private var classificationResults: [ClassificationResponse] = []
    @State private var editingItems: [ClothingItem] = []
    @State private var showErrorAlert = false
    @State private var errorMessage = ""
    
    // MARK: - Callback
    let onClothingAdded: (ClothingItem) -> Void
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                Color(.systemBackground).ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Progress Header
                    progressHeader
                    
                    // Main Content
                    ScrollView {
                        VStack(spacing: 20) {
                            switch currentStep {
                            case .photoSelection:
                                photoSelectionStep
                            case .classification:
                                classificationStep
                            case .editing:
                                editingStep
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("add_clothes".localized)
            .navigationBarTitleDisplayMode(.large)
            .toolbar(content: {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("cancel".localized) {
                        dismiss()
                    }
                }
                
                if currentStep == .editing {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("save_all".localized) {
                            saveAllItems()
                        }
                        .disabled(editingItems.isEmpty || clothingService.isLoading)
                    }
                }
            })
            .alert("error".localized, isPresented: $showErrorAlert) {
                Button("ok".localized) { }
            } message: {
                Text(errorMessage)
            }
        }
        .onChange(of: photoPickerService.errorMessage) { newValue in
            if let error = newValue {
                errorMessage = error
                showErrorAlert = true
                photoPickerService.errorMessage = nil
            }
        }
        .onChange(of: clothingService.errorMessage) { newValue in
            if let error = newValue {
                errorMessage = error
                showErrorAlert = true
                clothingService.errorMessage = nil
            }
        }
    }
    
    // MARK: - Progress Header
    private var progressHeader: some View {
        VStack(spacing: 12) {
            HStack {
                ForEach(AddClothesStep.allCases, id: \.self) { step in
                    Circle()
                        .fill(step.rawValue <= currentStep.rawValue ? Color.blue : Color(.systemGray4))
                        .frame(width: 12, height: 12)
                    
                    if step != AddClothesStep.allCases.last {
                        Rectangle()
                            .fill(step.rawValue < currentStep.rawValue ? Color.blue : Color(.systemGray4))
                            .frame(height: 2)
                    }
                }
            }
            .padding(.horizontal)
            
            Text(currentStep.title)
                .font(.headline)
                .foregroundColor(Color(.label))
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.05), radius: 1, x: 0, y: 1)
    }
    
    // MARK: - Photo Selection Step
    private var photoSelectionStep: some View {
        VStack(spacing: 24) {
            // Instructions
            VStack(spacing: 12) {
                Image(systemName: "camera.viewfinder")
                    .font(.system(size: 48))
                    .foregroundColor(.blue)
                
                Text("add_photos_clothes".localized)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("select_photos_instruction".localized)
                    .font(.body)
                    .foregroundColor(Color(.secondaryLabel))
                    .multilineTextAlignment(.center)
            }
            
            // Selected Images Preview
            if !photoPickerService.selectedImages.isEmpty {
                selectedImagesGrid
            }
            
            // Photo Source Buttons
            photoSourceButtons
            
            // Continue Button
            if !photoPickerService.selectedImages.isEmpty {
                Button {
                    classifyImages()
                } label: {
                    HStack {
                        Text(String(format: "classify_images".localized, photoPickerService.selectedImages.count))
                            .fontWeight(.semibold)
                        
                        Image(systemName: "arrow.right")
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color.blue)
                    .cornerRadius(12)
                }
                .disabled(clothingService.isLoading)
            }
        }
        .padding(.vertical)
        .sheet(isPresented: $photoPickerService.isShowingCamera) {
            CameraPickerCoordinator(
                isPresented: $photoPickerService.isShowingCamera,
                onImagePicked: photoPickerService.addImageFromCamera
            )
        }
        .sheet(isPresented: $photoPickerService.isShowingPhotoLibrary) {
            PhotoLibraryPickerCoordinator(
                isPresented: $photoPickerService.isShowingPhotoLibrary,
                onImagePicked: photoPickerService.addImageFromPhotoLibrary
            )
        }
        .sheet(isPresented: $photoPickerService.isShowingFilePicker) {
            DocumentPickerCoordinator(
                isPresented: $photoPickerService.isShowingFilePicker,
                onImagesPicked: { images in
                    photoPickerService.selectedImages.append(contentsOf: images.prefix(photoPickerService.remainingSlots))
                }
            )
        }
        .confirmationDialog("select_photo_source".localized, isPresented: $photoPickerService.isShowingSourceSelection) {
            ForEach(PhotoSource.allCases, id: \.self) { source in
                Button(source.localizedTitle) {
                    photoPickerService.selectSource(source)
                }
            }
            Button("cancel".localized, role: .cancel) { }
        }
    }
    
    // MARK: - Selected Images Grid
    private var selectedImagesGrid: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("selected_photos".localized + " (\(photoPickerService.selectedImages.count)/10)")
                    .font(.headline)
                Spacer()
                Button("clear_all".localized) {
                    photoPickerService.clearSelection()
                }
                .font(.caption)
                .foregroundColor(.red)
            }
            
            LazyVGrid(columns: [
                GridItem(.adaptive(minimum: 80), spacing: 8)
            ], spacing: 8) {
                ForEach(photoPickerService.selectedImages.indices, id: \.self) { index in
                    ZStack(alignment: .topTrailing) {
                        StandardClothingImageView(
                            uiImage: photoPickerService.selectedImages[index],
                            size: .small,
                            showShadow: false
                        )
                        
                        Button {
                            photoPickerService.removeImage(at: index)
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.red)
                                .background(Color(.systemBackground), in: Circle())
                        }
                        .offset(x: 4, y: -4)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
    }
    
    // MARK: - Photo Source Buttons
    private var photoSourceButtons: some View {
        VStack(spacing: 12) {
            ForEach(PhotoSource.allCases, id: \.self) { source in
                Button {
                    photoPickerService.selectSource(source)
                } label: {
                    photoSourceRow(for: source)
                }
                .disabled(!photoPickerService.canAddMoreImages)
                .opacity(photoPickerService.canAddMoreImages ? 1.0 : 0.6)
            }
        }
    }
    
    // Extracted row view for reuse between Button and PhotosPicker label
    private func photoSourceRow(for source: PhotoSource) -> some View {
        HStack(spacing: 16) {
            Image(systemName: source.icon)
                .font(.title2)
                .foregroundColor(source.color)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(source.localizedTitle)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(sourceDescription(for: source))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(12)
        .shadow(color: Color.dynamicShadow, radius: 2, x: 0, y: 1)
    }
    
    // MARK: - Classification Step
    private var classificationStep: some View {
        VStack(spacing: 24) {
            VStack(spacing: 16) {
                ProgressView()
                    .scaleEffect(1.5)
                
                Text("classifying_clothes".localized)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("ai_analyzing_photos".localized)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.vertical, 40)
        }
    }
    
    // MARK: - Editing Step
    private var editingStep: some View {
        VStack(spacing: 20) {
            if editingItems.isEmpty {
                Text("no_items_to_edit".localized)
                    .font(.headline)
                    .foregroundColor(.secondary)
            } else {
                ForEach(editingItems.indices, id: \.self) { index in
                    ClothingItemEditCard(
                        item: $editingItems[index],
                        image: index < photoPickerService.selectedImages.count ? photoPickerService.selectedImages[index] : nil,
                        classification: index < classificationResults.count ? classificationResults[index] : nil
                    )
                }
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func sourceDescription(for source: PhotoSource) -> String {
        switch source {
        case .camera:
            return "take_new_photos".localized
        case .photoLibrary:
            return "choose_from_photos".localized
        case .files:
            return "import_from_files".localized
        }
    }
    
    private func classifyImages() {
        currentStep = .classification
        
        Task {
            do {
                let results = try await clothingService.uploadAndClassifyImages(photoPickerService.selectedImages)
                
                // ВЫВОД ОТВЕТА БЭКЭНДА В ТЕРМИНАЛ
                print("=== ОТВЕТ БЭКЭНДА ПОСЛЕ КЛАССИФИКАЦИИ ===")
                for (index, result) in results.enumerated() {
                    print("Изображение \(index + 1):")
                    print("URL: \(result.url)")
                    if let classification = result.classification {
                        print("Классификация:")
                        print("  - Тип одежды: \(classification.clothingType ?? "N/A")")
                        print("  - Предсказанное название: \(classification.predictedName ?? "N/A")")
                        print("  - Предсказанная категория: \(classification.predictedCategory ?? "N/A")")
                        print("  - Предсказанный бренд: \(classification.predictedBrand ?? "N/A")")
                        print("  - Предсказанный цвет: \(classification.predictedColor ?? "N/A")")
                        print("  - Предсказанный материал: \(classification.predictedMaterial ?? "N/A")")
                        print("  - Описание: \(classification.description ?? "N/A")")
                        print("  - Уверенность: \(classification.confidenceScore)")
                        print("  - Теги: \(classification.predictedTags ?? [])")
                        print("  - Случаи использования: \(classification.occasions ?? [])")
                        print("  - Погодные условия: \(classification.weatherSuitability ?? [])")
                        if let additionalDetails = classification.additionalDetails {
                            print("  - Дополнительные детали: \(additionalDetails)")
                        }
                    } else {
                        print("Классификация: отсутствует")
                    }
                    print("---")
                }
                print("=== КОНЕЦ ОТВЕТА БЭКЭНДА ===")
                
                await MainActor.run {
                    classificationResults = results.compactMap { $0.classification }
                    editingItems = results.enumerated().map { index, result in
                        createClothingItem(from: result, at: index)
                    }
                    currentStep = .editing
                }
            } catch {
                print("=== ОШИБКА КЛАССИФИКАЦИИ ===")
                print("Ошибка: \(error)")
                print("=== КОНЕЦ ОШИБКИ ===")
                
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showErrorAlert = true
                    currentStep = .photoSelection
                }
            }
        }
    }
    
    private func createClothingItem(from result: UploadResponse, at index: Int) -> ClothingItem {
        let classification = result.classification
        
        return ClothingItem(
            id: 0, // Temporary ID, will be set by backend
            name: classification?.predictedName ?? classification?.clothingType ?? "Unknown Item",
            brand: classification?.predictedBrand ?? classification?.brand,
            category: classification?.predictedCategory ?? classification?.clothingType,
            gender: classification?.additionalDetails?["gender"] ?? nil,
            color: classification?.predictedColor ?? classification?.color,
            size: classification?.additionalDetails?["size"] ?? nil,
            material: classification?.predictedMaterial ?? classification?.material,
            description: classification?.description,
            imageURL: result.url,
            storeName: "User Upload",
            storeURL: nil,
            productURL: nil,
            price: 0.0,
            tags: classification?.predictedTags ?? [],
            occasions: classification?.occasions ?? [],
            weatherSuitability: classification?.weatherSuitability ?? [],
            ownerID: 0, // Will be set by backend
            available: true,
            updatedAt: nil,
            aiGeneratedEmbedding: nil
        )
    }
    
    private func saveAllItems() {
        Task {
            for item in editingItems {
                do {
                    let clothingItemCreate = ClothingItemCreate(
                        name: item.name,
                        brand: item.brand?.isEmpty == false ? item.brand : nil,
                        category: item.category?.isEmpty == false ? item.category : nil,
                        gender: item.gender?.isEmpty == false ? item.gender : nil,
                        color: item.color?.isEmpty == false ? item.color : nil,
                        size: item.size?.isEmpty == false ? item.size : nil,
                        material: item.material?.isEmpty == false ? item.material : nil,
                        description: item.description?.isEmpty == false ? item.description : nil,
                        imageURL: item.imageURL,
                        storeName: "User Upload",
                        storeURL: nil,
                        productURL: nil,
                        price: 0.0,
                        tags: item.tags,
                        occasions: item.occasions,
                        weatherSuitability: item.weatherSuitability,
                        aiGeneratedEmbedding: nil
                    )
                    
                    let savedItem = try await clothingService.addClothingItem(clothingItemCreate)
                    await MainActor.run {
                        onClothingAdded(savedItem)
                    }
                } catch {
                    await MainActor.run {
                        errorMessage = "Failed to save \(item.name): \(error.localizedDescription)"
                        showErrorAlert = true
                    }
                    return
                }
            }
            
            await MainActor.run {
                dismiss()
            }
        }
    }
}

// MARK: - Add Clothes Step Enum
enum AddClothesStep: Int, CaseIterable {
    case photoSelection = 1
    case classification = 2
    case editing = 3
    
    var title: String {
        switch self {
        case .photoSelection:
            return "Select Photos"
        case .classification:
            return "AI Classification"
        case .editing:
            return "Edit Details"
        }
    }
}

// MARK: - Clothing Item Edit Card
struct ClothingItemEditCard: View {
    @Binding var item: ClothingItem
    let image: UIImage?
    let classification: ClassificationResponse?
    
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header with image and basic info
            HStack(spacing: 16) {
                if let image = image {
                    StandardClothingImageView(
                        uiImage: image,
                        size: .small,
                        showShadow: false
                    )
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    TextField("Item name", text: Binding(
                        get: { item.name },
                        set: { newName in
                            item = ClothingItem(
                                id: item.id,
                                name: newName,
                                brand: item.brand,
                                category: item.category,
                                gender: item.gender,
                                color: item.color,
                                size: item.size,
                                material: item.material,
                                description: item.description,
                                imageURL: item.imageURL,
                                storeName: item.storeName,
                                storeURL: item.storeURL,
                                productURL: item.productURL,
                                price: item.price,
                                tags: item.tags,
                                occasions: item.occasions,
                                weatherSuitability: item.weatherSuitability,
                                ownerID: item.ownerID,
                                available: item.available,
                                updatedAt: item.updatedAt,
                                aiGeneratedEmbedding: item.aiGeneratedEmbedding
                            )
                        }
                    ))
                    .textFieldStyle(.roundedBorder)
                    .font(.headline)
                    
                    if let classification = classification {
                        Text("Confidence: \(Int(classification.confidenceScore * 100))%")
                            .font(.caption)
                            .foregroundColor(Color(.secondaryLabel))
                    }
                }
                
                Spacer()
                
                Button {
                    withAnimation {
                        isExpanded.toggle()
                    }
                } label: {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(Color(.secondaryLabel))
                }
            }
            
            // Expanded details
            if isExpanded {
                VStack(spacing: 12) {
                    HStack {
                        Text("Category:")
                            .fontWeight(.medium)
                        TextField("Category", text: Binding(
                            get: { item.category ?? "" },
                            set: { newCategory in
                                item = ClothingItem(
                                    id: item.id,
                                    name: item.name,
                                    brand: item.brand,
                                    category: newCategory.isEmpty ? nil : newCategory,
                                    gender: item.gender,
                                    color: item.color,
                                    size: item.size,
                                    material: item.material,
                                    description: item.description,
                                    imageURL: item.imageURL,
                                    storeName: item.storeName,
                                    storeURL: item.storeURL,
                                    productURL: item.productURL,
                                    price: item.price,
                                    tags: item.tags,
                                    occasions: item.occasions,
                                    weatherSuitability: item.weatherSuitability,
                                    ownerID: item.ownerID,
                                    available: item.available,
                                    updatedAt: item.updatedAt,
                                    aiGeneratedEmbedding: item.aiGeneratedEmbedding
                                )
                            }
                        ))
                        .textFieldStyle(.roundedBorder)
                    }
                    
                    HStack {
                        Text("Color:")
                            .fontWeight(.medium)
                        TextField("Color", text: Binding(
                            get: { item.color ?? "" },
                            set: { newColor in
                                item = ClothingItem(
                                    id: item.id,
                                    name: item.name,
                                    brand: item.brand,
                                    category: item.category,
                                    gender: item.gender,
                                    color: newColor.isEmpty ? nil : newColor,
                                    size: item.size,
                                    material: item.material,
                                    description: item.description,
                                    imageURL: item.imageURL,
                                    storeName: item.storeName,
                                    storeURL: item.storeURL,
                                    productURL: item.productURL,
                                    price: item.price,
                                    tags: item.tags,
                                    occasions: item.occasions,
                                    weatherSuitability: item.weatherSuitability,
                                    ownerID: item.ownerID,
                                    available: item.available,
                                    updatedAt: item.updatedAt,
                                    aiGeneratedEmbedding: item.aiGeneratedEmbedding
                                )
                            }
                        ))
                        .textFieldStyle(.roundedBorder)
                    }
                    
                    if !item.tags.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("AI-Generated Tags:")
                                .fontWeight(.medium)
                            
                            FlowLayout(spacing: 8) {
                                ForEach(item.tags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.caption)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.blue.opacity(0.1))
                                        .foregroundColor(.blue)
                                        .cornerRadius(12)
                                }
                            }
                        }
                    }
                }
                .transition(.opacity.combined(with: .scale))
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

// MARK: - Flow Layout for Tags
struct FlowLayout<Content: View>: View {
    let spacing: CGFloat
    let content: () -> Content
    
    init(spacing: CGFloat = 8, @ViewBuilder content: @escaping () -> Content) {
        self.spacing = spacing
        self.content = content
    }
    
    var body: some View {
        VariableHeightHStack(spacing: spacing) {
            content()
        }
    }
}

struct VariableHeightHStack<Content: View>: View {
    let spacing: CGFloat
    let content: () -> Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: spacing) {
            content()
        }
    }
}

// MARK: - Preview
#Preview {
    AddClothesView { _ in }
}
