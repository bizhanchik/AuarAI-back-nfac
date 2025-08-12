//
//  LanguagePickerView.swift
//  AuarAI
//
//  Created by AuarAI on 21.07.2025.
//

import SwiftUI

struct LanguagePickerView: View {
    @StateObject private var localizationManager = LocalizationManager.shared
    @Environment(\.dismiss) private var dismiss
    @State private var selectedLanguage: SupportedLanguage
    
    init() {
        _selectedLanguage = State(initialValue: LocalizationManager.shared.currentLanguage)
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                headerSection
                
                // Language Options
                languageList
                
                Spacer()
            }
            .navigationTitle("language_settings".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("cancel".localized) {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("done".localized) {
                        localizationManager.currentLanguage = selectedLanguage
                        dismiss()
                    }
                    .disabled(selectedLanguage == localizationManager.currentLanguage)
                }
            }
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 16) {
            Image(systemName: "globe")
                .font(.system(size: 48))
                .foregroundColor(.blue)
            
            Text("select_language".localized)
                .font(.title2)
                .fontWeight(.semibold)
                .multilineTextAlignment(.center)
            
            Text("language_description".localized)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 32)
    }
    
    // MARK: - Language List
    private var languageList: some View {
        VStack(spacing: 0) {
            ForEach(SupportedLanguage.allCases, id: \.self) { language in
                LanguageRow(
                    language: language,
                    isSelected: selectedLanguage == language,
                    onTap: {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedLanguage = language
                        }
                    }
                )
                
                if language != SupportedLanguage.allCases.last {
                    Divider()
                        .padding(.leading, 80)
                }
            }
        }
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .padding(.horizontal, 20)
    }
}

// MARK: - Language Row Component
struct LanguageRow: View {
    let language: SupportedLanguage
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                // Flag Emoji
                Text(language.flagEmoji)
                    .font(.system(size: 32))
                
                // Language Name
                VStack(alignment: .leading, spacing: 2) {
                    Text(language.displayName)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(language.code.uppercased())
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Selection Indicator
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(.blue)
                } else {
                    Image(systemName: "circle")
                        .font(.title2)
                        .foregroundColor(.gray.opacity(0.3))
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .background(
            isSelected ? Color.blue.opacity(0.05) : Color.clear
        )
        .animation(.easeInOut(duration: 0.2), value: isSelected)
    }
}

// MARK: - Preview
#Preview {
    LanguagePickerView()
}