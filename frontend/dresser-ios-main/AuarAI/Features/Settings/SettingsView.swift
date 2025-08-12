//
//  SettingsView.swift
//  AuarAI
//
//  Created by AuarAI on 21.07.2025.
//

import SwiftUI

struct SettingsView: View {
    @StateObject private var authService = AuthenticationService()
    @StateObject private var userPreferences = UserPreferences.shared
    @StateObject private var localizationManager = LocalizationManager.shared
    @State private var showDeleteAccountAlert = false
    @State private var showDeleteConfirmation = false
    @State private var showEditName = false
    @State private var showLanguagePicker = false
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            List {
                // User Profile Section
                Section {
                    if case .authenticated(let user) = authService.authenticationState {
                        HStack(spacing: 16) {
                            // Profile Image with first letter fallback
                            Button {
                                showLanguagePicker = true
                            } label: {
                                ProfileImageView(
                                    imageURL: user.profileImageURL,
                                    name: userPreferences.getDisplayName(for: user),
                                    size: 60
                                )
                            }
                            .buttonStyle(.plain)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(userPreferences.getDisplayName(for: user))
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                Text("tap_to_edit_name".localized)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            Image(systemName: "chevron.right")
                                .foregroundColor(.secondary)
                                .font(.caption)
                        }
                        .padding(.vertical, 8)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            showEditName = true
                        }
                    }
                }
                
                // Language Section
                Section("language_settings".localized) {
                    HStack {
                        Image(systemName: "globe")
                            .foregroundColor(.blue)
                        Text("select_language".localized)
                        Spacer()
                        Text(localizationManager.currentLanguage.displayName)
                            .foregroundColor(.secondary)
                        Text(localizationManager.currentLanguage.flagEmoji)
                        Image(systemName: "chevron.right")
                            .foregroundColor(.secondary)
                            .font(.caption)
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        showLanguagePicker = true
                    }
                }
                
                // Account Actions Section
                Section("account".localized) {
                    Button {
                        Task {
                            await authService.signOut()
                        }
                    } label: {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .foregroundColor(.blue)
                            Text("sign_out".localized)
                                .foregroundColor(.blue)
                        }
                    }
                    .disabled(authService.isLoading)
                    
                    Button {
                        showDeleteAccountAlert = true
                    } label: {
                        HStack {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                            Text("delete_account".localized)
                                .foregroundColor(.red)
                        }
                    }
                    .disabled(authService.isLoading)
                }
            }
            .navigationTitle("settings".localized)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("done".localized) {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showEditName) {
            if case .authenticated(let user) = authService.authenticationState {
                EditNameView(currentUser: user)
            }
        }
        .sheet(isPresented: $showLanguagePicker) {
            LanguagePickerView()
        }
        .alert("delete_account".localized, isPresented: $showDeleteAccountAlert) {
            Button("cancel".localized, role: .cancel) { }
            Button("delete".localized, role: .destructive) {
                showDeleteConfirmation = true
            }
        } message: {
            Text("delete_account_confirmation".localized)
        }
        .alert("final_confirmation".localized, isPresented: $showDeleteConfirmation) {
            Button("cancel".localized, role: .cancel) { }
            Button("delete_forever".localized, role: .destructive) {
                Task {
                    await authService.deleteAccount()
                }
            }
        } message: {
            Text("delete_account_final_warning".localized)
        }
        .alert("error".localized, isPresented: .constant(authService.errorMessage != nil)) {
            Button("ok".localized) {
                authService.errorMessage = nil
            }
        } message: {
            Text(authService.errorMessage ?? "")
        }
    }
}

#Preview {
    SettingsView()
}
