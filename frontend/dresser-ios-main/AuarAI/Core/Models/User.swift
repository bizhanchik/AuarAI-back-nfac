//
//  User.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import Foundation

// MARK: - User Model
struct User: Identifiable, Codable, Equatable {
    let id: String
    let email: String
    let name: String
    let profileImageURL: URL?
    let createdAt: Date
    let updatedAt: Date
    
    init(id: String, email: String, name: String, profileImageURL: URL? = nil) {
        self.id = id
        self.email = email
        self.name = name
        self.profileImageURL = profileImageURL
        self.createdAt = Date()
        self.updatedAt = Date()
    }
}

// MARK: - Authentication State
// enum AuthenticationState: Equatable {
//     case unauthenticated
//     case authenticating
//     case authenticated(User)
// } 