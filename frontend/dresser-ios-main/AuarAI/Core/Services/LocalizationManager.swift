//
//  LocalizationManager.swift
//  AuarAI
//
//  Created by AuarAI on 21.07.2025.
//

import SwiftUI
import Foundation

// MARK: - Supported Languages
enum SupportedLanguage: String, CaseIterable {
    case english = "en"
    case kazakh = "kk"
    case russian = "ru"
    
    var displayName: String {
        switch self {
        case .english:
            return "English"
        case .russian:
            return "Русский"
        case .kazakh:
            return "Қазақ"
        }
    }
    
    var flagEmoji: String {
        switch self {
        case .english:
            return "🇺🇸"
        case .russian:
            return "🇷🇺"
        case .kazakh:
            return "🇰🇿"
        }
    }
    
    var code: String {
        return self.rawValue
    }
}

// MARK: - Localization Manager
class LocalizationManager: ObservableObject {
    static let shared = LocalizationManager()
    
    @Published var currentLanguage: SupportedLanguage {
        didSet {
            UserDefaults.standard.set(currentLanguage.rawValue, forKey: "selected_language")
            updateBundle()
        }
    }
    
    private var bundle: Bundle = Bundle.main
    
    private init() {
        // Get saved language only, no automatic system language detection
        if let savedLanguage = UserDefaults.standard.string(forKey: "selected_language"),
           let language = SupportedLanguage(rawValue: savedLanguage) {
            self.currentLanguage = language
        } else {
            // No default language - user must choose
            // Using English as temporary fallback for localization system
            self.currentLanguage = .english
        }
        updateBundle()
    }
    
    private func updateBundle() {
        if let path = Bundle.main.path(forResource: currentLanguage.rawValue, ofType: "lproj"),
           let bundle = Bundle(path: path) {
            self.bundle = bundle
        } else {
            self.bundle = Bundle.main
        }
    }
    
    func localizedString(for key: String) -> String {
        return bundle.localizedString(forKey: key, value: key, table: nil)
    }
}

// MARK: - String Extension for Localization
extension String {
    var localized: String {
        return LocalizationManager.shared.localizedString(for: self)
    }
}