//
//  UserPreferences.swift
//  AuarAI
//
//  Created by AuarAI on 21.07.2025.
//

import Foundation

// MARK: - User Preferences Service
@MainActor
final class UserPreferences: ObservableObject {
    static let shared = UserPreferences()
    
    @Published var displayName: String = ""
    
    private let userDefaults = UserDefaults.standard
    private let displayNameKey = "user_display_name"
    
    private init() {
        loadPreferences()
    }
    
    // MARK: - Public Methods
    
    /// Update the display name and save to UserDefaults
    func updateDisplayName(_ name: String) {
        displayName = name
        userDefaults.set(name, forKey: displayNameKey)
    }
    
    /// Get the display name for a user, falling back to their original name if no custom name is set
    func getDisplayName(for user: User) -> String {
        if !displayName.isEmpty {
            return displayName
        }
        return user.name.isEmpty ? "User" : user.name
    }
    
    /// Clear all preferences (useful for sign out)
    func clearPreferences() {
        displayName = ""
        userDefaults.removeObject(forKey: displayNameKey)
    }
    
    // MARK: - Private Methods
    
    private func loadPreferences() {
        displayName = userDefaults.string(forKey: displayNameKey) ?? ""
    }
}