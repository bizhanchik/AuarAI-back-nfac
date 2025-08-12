import SwiftUI

// MARK: - Dynamic App Colors
/// Central place for semantic, theme-aware colors that automatically adapt between light and dark mode.
/// Use these throughout the codebase instead of hard-coded `.white`, `.black`, or static system colors.
public extension Color {
    /// Primary background for cards, list rows, etc. Uses `secondarySystemBackground` which already adapts.
    static let cardBackground = Color(uiColor: .secondarySystemBackground)
    /// Plain app background (should usually be used at the window/root level).
    static let appBackground = Color(uiColor: .systemBackground)
    /// Very subtle border/overlay color.
    static let separator = Color(uiColor: .separator)

    /// A dynamic shadow color that flips from dark in light mode to light in dark mode for visibility.
    static var dynamicShadow: Color {
        Color(UIColor { trait in
            trait.userInterfaceStyle == .dark ?
            UIColor.white.withAlphaComponent(0.12) :
            UIColor.black.withAlphaComponent(0.08)
        })
    }
} 