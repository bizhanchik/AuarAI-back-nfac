//
//  PhotoPickerService.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI
import UIKit
import AVFoundation

// MARK: - Photo Source Options
enum PhotoSource: String, CaseIterable {
    case camera = "camera"
    case photoLibrary = "photo_library"
    case files = "files"
    
    var localizedTitle: String {
        switch self {
        case .camera: return "camera".localized
        case .photoLibrary: return "photo_library".localized
        case .files: return "files".localized
        }
    }
    
    var icon: String {
        switch self {
        case .camera:
            return "camera.fill"
        case .photoLibrary:
            return "photo.on.rectangle"
        case .files:
            return "folder.fill"
        }
    }
    
    var color: Color {
        switch self {
        case .camera:
            return .blue
        case .photoLibrary:
            return .green
        case .files:
            return .orange
        }
    }
}

// MARK: - Photo Picker Result
struct PhotoPickerResult {
    let images: [UIImage]
    let source: PhotoSource
}

// MARK: - Photo Picker Service
@MainActor
class PhotoPickerService: ObservableObject {
    
    // MARK: - Published Properties
    @Published var selectedImages: [UIImage] = []
    @Published var isShowingSourceSelection = false
    @Published var isShowingCamera = false
    @Published var isShowingPhotoLibrary = false
    @Published var isShowingFilePicker = false
    @Published var errorMessage: String?
    
    // MARK: - Private Properties
    private let maxImages = 10
    
    // MARK: - Public Methods
    
    /// Show source selection action sheet
    func showSourceSelection() {
        isShowingSourceSelection = true
    }
    
    /// Select photo source and show appropriate picker
    func selectSource(_ source: PhotoSource) {
        switch source {
        case .camera:
            checkCameraPermission()
        case .photoLibrary:
            isShowingPhotoLibrary = true
        case .files:
            isShowingFilePicker = true
        }
    }
    
    /// Process selected photos from PhotosPicker
    func processSelectedPhotos(_ items: [Any]) async {
        // This method is no longer needed for iOS 15.6 compatibility
        // Photo library selection is now handled via UIImagePickerController
    }
    
    /// Add image from photo library
    func addImageFromPhotoLibrary(_ image: UIImage) {
        if selectedImages.count < maxImages {
            selectedImages.append(image)
        } else {
            errorMessage = "Maximum \(maxImages) images allowed"
        }
    }
    
    /// Add image from camera
    func addImageFromCamera(_ image: UIImage) {
        if selectedImages.count < maxImages {
            selectedImages.append(image)
        } else {
            errorMessage = "Maximum \(maxImages) images allowed"
        }
    }
    
    /// Remove image at index
    func removeImage(at index: Int) {
        guard index < selectedImages.count else { return }
        selectedImages.remove(at: index)
    }
    
    /// Clear all selected images
    func clearSelection() {
        selectedImages.removeAll()
    }
    
    /// Check if can add more images
    var canAddMoreImages: Bool {
        selectedImages.count < maxImages
    }
    
    /// Remaining image slots
    var remainingSlots: Int {
        maxImages - selectedImages.count
    }
    
    // MARK: - Private Methods
    
    private func checkCameraPermission() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            isShowingCamera = true
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    if granted {
                        self.isShowingCamera = true
                    } else {
                        self.errorMessage = "Camera access is required to take photos"
                    }
                }
            }
        case .denied, .restricted:
            errorMessage = "camera_access_denied".localized
        @unknown default:
            errorMessage = "Unknown camera permission status"
        }
    }
}

// MARK: - Photo Library Picker Coordinator
struct PhotoLibraryPickerCoordinator: UIViewControllerRepresentable {
    @Binding var isPresented: Bool
    let onImagePicked: (UIImage) -> Void
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .photoLibrary
        picker.allowsEditing = false
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: PhotoLibraryPickerCoordinator
        
        init(_ parent: PhotoLibraryPickerCoordinator) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let editedImage = info[.editedImage] as? UIImage {
                parent.onImagePicked(editedImage)
            } else if let originalImage = info[.originalImage] as? UIImage {
                parent.onImagePicked(originalImage)
            }
            parent.isPresented = false
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.isPresented = false
        }
    }
}

// MARK: - UIImagePickerController Coordinator
struct CameraPickerCoordinator: UIViewControllerRepresentable {
    @Binding var isPresented: Bool
    let onImagePicked: (UIImage) -> Void
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .camera
        picker.cameraCaptureMode = .photo
        picker.allowsEditing = false
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraPickerCoordinator
        
        init(_ parent: CameraPickerCoordinator) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let editedImage = info[.editedImage] as? UIImage {
                parent.onImagePicked(editedImage)
            } else if let originalImage = info[.originalImage] as? UIImage {
                parent.onImagePicked(originalImage)
            }
            parent.isPresented = false
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.isPresented = false
        }
    }
}

// MARK: - Document Picker Coordinator
struct DocumentPickerCoordinator: UIViewControllerRepresentable {
    @Binding var isPresented: Bool
    let onImagesPicked: ([UIImage]) -> Void
    
    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.image])
        picker.delegate = context.coordinator
        picker.allowsMultipleSelection = true
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let parent: DocumentPickerCoordinator
        
        init(_ parent: DocumentPickerCoordinator) {
            self.parent = parent
        }
        
        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            var images: [UIImage] = []
            
            for url in urls.prefix(10) {
                if url.startAccessingSecurityScopedResource() {
                    defer { url.stopAccessingSecurityScopedResource() }
                    
                    if let data = try? Data(contentsOf: url),
                       let image = UIImage(data: data) {
                        images.append(image)
                    }
                }
            }
            
            parent.onImagesPicked(images)
            parent.isPresented = false
        }
        
        func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
            parent.isPresented = false
        }
    }
}
