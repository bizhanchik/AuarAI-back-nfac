//
//  EditNameView.swift
//  AuarAI
//
//  Created by AuarAI on 21.07.2025.
//

import SwiftUI

// MARK: - Edit Name View
struct EditNameView: View {
    @StateObject private var userPreferences = UserPreferences.shared
    @Environment(\.dismiss) private var dismiss
    
    let currentUser: User
    @State private var newName: String = ""
    @State private var isValid: Bool = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Profile Preview
                VStack(spacing: 16) {
                    ProfileImageView(
                        imageURL: currentUser.profileImageURL,
                        name: newName.isEmpty ? userPreferences.getDisplayName(for: currentUser) : newName,
                        size: 100
                    )
                    
                    Text("preview".localized)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 20)
                
                // Name Input Section
                VStack(alignment: .leading, spacing: 8) {
                    Text("display_name".localized)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    TextField("enter_your_name".localized, text: $newName)
                        .textFieldStyle(.roundedBorder)
                        .font(.body)
                        .autocorrectionDisabled()
                        .onSubmit {
                            if isValid {
                                saveName()
                            }
                        }
                    
                    Text("name_description".localized)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .navigationTitle("edit_name".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("cancel".localized) {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("save".localized) {
                        saveName()
                    }
                    .disabled(!isValid)
                }
            }
        }
        .onAppear {
            newName = userPreferences.getDisplayName(for: currentUser)
            updateValidation()
        }
        .onChange(of: newName) { _ in
            updateValidation()
        }
    }
    
    // MARK: - Private Methods
    
    private func updateValidation() {
        let trimmedName = newName.trimmingCharacters(in: .whitespacesAndNewlines)
        isValid = !trimmedName.isEmpty && trimmedName.count >= 1 && trimmedName.count <= 50
    }
    
    private func saveName() {
        let trimmedName = newName.trimmingCharacters(in: .whitespacesAndNewlines)
        userPreferences.updateDisplayName(trimmedName)
        dismiss()
    }
}

// MARK: - Preview
#Preview {
    EditNameView(currentUser: User(
        id: "123",
        email: "test@example.com",
        name: "John Doe"
    ))
}