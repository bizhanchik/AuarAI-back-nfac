//
//  AuthenticationService.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import Foundation
import UIKit
import FirebaseCore
import FirebaseAuth
import GoogleSignIn
import AuthenticationServices
import CryptoKit

// MARK: - Authentication Errors
enum AuthenticationError: LocalizedError {
    case signInFailed(String)
    case signOutFailed
    case userNotFound
    case networkError
    
    var errorDescription: String? {
        switch self {
        case .signInFailed(let message):
            return "Sign in failed: \(message)"
        case .signOutFailed:
            return "Failed to sign out"
        case .userNotFound:
            return "User not found"
        case .networkError:
            return "Network error occurred"
        }
    }
}

// MARK: - Authentication State
enum AuthenticationState: Equatable {
    case authenticated(User)
    case authenticating
    case unauthenticated
    case checkingAuth // New state for initial load
}

// MARK: - Authentication Service
@MainActor
final class AuthenticationService: NSObject, ObservableObject {
    @Published var authenticationState: AuthenticationState = .checkingAuth // Default to new state
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var authStateListener: AuthStateDidChangeListenerHandle?
    private var currentNonce: String?
    
    override init() {
        super.init()
        addAuthStateListener()
    }
    
    deinit {
        if let listener = authStateListener {
            Auth.auth().removeStateDidChangeListener(listener)
        }
    }
    
    // MARK: - Public Methods
    
    /// Sign in with Google
    func signInWithGoogle() async {
        isLoading = true
        errorMessage = nil
        authenticationState = .authenticating
        
        do {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let window = windowScene.windows.first,
                  let rootViewController = window.rootViewController else {
                throw AuthenticationError.signInFailed("Unable to get root view controller")
            }
            
            // Get Google Sign-In configuration
            guard let clientID = FirebaseApp.app()?.options.clientID else {
                throw AuthenticationError.signInFailed("Unable to get Firebase client ID")
            }
            
            let config = GIDConfiguration(clientID: clientID)
            GIDSignIn.sharedInstance.configuration = config
            
            // Perform Google Sign-In
            let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)
            let user = result.user
            
            guard let idToken = user.idToken?.tokenString else {
                throw AuthenticationError.signInFailed("Unable to get ID token")
            }
            
            let credential = GoogleAuthProvider.credential(withIDToken: idToken,
                                                         accessToken: user.accessToken.tokenString)
            
            // Sign in to Firebase
            let authResult = try await Auth.auth().signIn(with: credential)
            let firebaseUser = authResult.user
            
            // Create user model
            let auarUser = User(
                id: firebaseUser.uid,
                email: firebaseUser.email?.isEmpty == false ? firebaseUser.email! : "noemail@apple.signin",
                name: firebaseUser.displayName ?? "",
                profileImageURL: firebaseUser.photoURL
            )
            
            authenticationState = .authenticated(auarUser)
            
        } catch {
            errorMessage = error.localizedDescription
            authenticationState = .unauthenticated
        }
        
        isLoading = false
    }
    
    /// Sign out
    func signOut() async {
        isLoading = true
        errorMessage = nil
        
        do {
            try Auth.auth().signOut()
            GIDSignIn.sharedInstance.signOut()
            
            // Clear user preferences
            UserPreferences.shared.clearPreferences()
            
            authenticationState = .unauthenticated
        } catch {
            errorMessage = "Failed to sign out: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    /// Sign in with Apple
    func signInWithApple() {
        isLoading = true
        errorMessage = nil
        authenticationState = .authenticating
        
        let nonce = randomNonceString()
        currentNonce = nonce
        
        let appleIDProvider = ASAuthorizationAppleIDProvider()
        let request = appleIDProvider.createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = sha256(nonce)
        
        let authorizationController = ASAuthorizationController(authorizationRequests: [request])
        authorizationController.delegate = self
        authorizationController.presentationContextProvider = self
        authorizationController.performRequests()
    }
    
    /// Delete user account
    func deleteAccount() async {
        isLoading = true
        errorMessage = nil
        
        do {
            guard let user = Auth.auth().currentUser else {
                throw AuthenticationError.userNotFound
            }
            
            // Get Firebase ID token for backend authentication
            let idToken = try await user.getIDToken()
            
            // Try to call backend to delete user data (optional for now)
            do {
                try await deleteUserFromBackend(idToken: idToken)
            } catch {
                // If backend call fails, continue with Firebase deletion
                // This ensures the delete function works even if backend is not updated
                print("Backend deletion failed, continuing with Firebase deletion: \(error)")
            }
            
            // Delete from Firebase Auth (this is the main requirement for Apple Review)
            try await user.delete()
            
            // Sign out from Google if needed
            GIDSignIn.sharedInstance.signOut()
            
            // Clear user preferences
            UserPreferences.shared.clearPreferences()
            
            authenticationState = .unauthenticated
            
        } catch {
            errorMessage = "Failed to delete account: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    /// Delete user from backend
    private func deleteUserFromBackend(idToken: String) async throws {
        guard let url = URL(string: "https://auarai.com/api/auth/delete-account") else {
            throw AuthenticationError.networkError
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(idToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw AuthenticationError.networkError
            }
            
            if httpResponse.statusCode == 200 {
                return // Success
            } else {
                // Try to get error message from response
                if let errorData = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let detail = errorData["detail"] as? String {
                    throw AuthenticationError.signInFailed("Backend error: \(detail)")
                } else {
                    throw AuthenticationError.signInFailed("HTTP \(httpResponse.statusCode)")
                }
            }
        } catch {
            if error is AuthenticationError {
                throw error
            } else {
                throw AuthenticationError.networkError
            }
        }
    }
    
    // MARK: - Private Methods
    
    private func addAuthStateListener() {
        authStateListener = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            Task { @MainActor in
                if let user = user {
                    // Check if user has email, if not, handle appropriately
                    let userEmail = user.email ?? ""
                    
                    // If email is empty and this is a new authentication, show error
                    if userEmail.isEmpty {
                        print("Warning: User authenticated without email")
                        // For Apple Sign In users without email, we'll use a placeholder
                        // The backend should handle this case or we need to request email differently
                    }
                    
                    let auarUser = User(
                        id: user.uid,
                        email: userEmail.isEmpty ? "noemail@apple.signin" : userEmail,
                        name: user.displayName ?? "",
                        profileImageURL: user.photoURL
                    )
                    self?.authenticationState = .authenticated(auarUser)
                } else {
                    self?.authenticationState = .unauthenticated
                }
            }
        }
    }
    
    // MARK: - Apple Sign In Helper Methods
    
    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        let charset: [Character] =
        Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remainingLength = length
        
        while remainingLength > 0 {
            let randoms: [UInt8] = (0 ..< 16).map { _ in
                var random: UInt8 = 0
                let errorCode = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
                if errorCode != errSecSuccess {
                    fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(errorCode)")
                }
                return random
            }
            
            randoms.forEach { random in
                if remainingLength == 0 {
                    return
                }
                
                if random < charset.count {
                    result.append(charset[Int(random)])
                    remainingLength -= 1
                }
            }
        }
        
        return result
    }
    
    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        let hashString = hashedData.compactMap {
            String(format: "%02x", $0)
        }.joined()
        
        return hashString
    }
}

// MARK: - ASAuthorizationControllerDelegate
extension AuthenticationService: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential {
            guard let nonce = currentNonce else {
                fatalError("Invalid state: A login callback was received, but no login request was sent.")
            }
            guard let appleIDToken = appleIDCredential.identityToken else {
                print("Unable to fetch identity token")
                return
            }
            guard let idTokenString = String(data: appleIDToken, encoding: .utf8) else {
                print("Unable to serialize token string from data: \(appleIDToken.debugDescription)")
                return
            }
            
            // Initialize a Firebase credential
            let credential = OAuthProvider.credential(providerID: AuthProviderID.apple,
                                                    idToken: idTokenString,
                                                    rawNonce: nonce)
            
            // Sign in with Firebase
            Task { @MainActor in
                isLoading = true
                authenticationState = .authenticating
                
                do {
                    let result = try await Auth.auth().signIn(with: credential)
                    let firebaseUser = result.user
                    
                    // Create user model
                    let auarUser = User(
                        id: firebaseUser.uid,
                        email: firebaseUser.email?.isEmpty == false ? firebaseUser.email! : "noemail@apple.signin",
                        name: firebaseUser.displayName ?? appleIDCredential.fullName?.formatted() ?? "",
                        profileImageURL: firebaseUser.photoURL
                    )
                    
                    authenticationState = .authenticated(auarUser)
                } catch {
                    errorMessage = error.localizedDescription
                    authenticationState = .unauthenticated
                }
                
                isLoading = false
            }
        }
    }
    
    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        // Handle error
        print("Sign in with Apple errored: \(error)")
        DispatchQueue.main.async {
            self.isLoading = false
            self.authenticationState = .unauthenticated // Always reset to unauthenticated on error
            
            // Check for specific Apple Sign In error codes
            if let authError = error as? ASAuthorizationError {
                switch authError.code {
                case .canceled:
                    // User canceled the sign-in process
                    self.errorMessage = nil // Don't show error for user cancellation
                case .failed:
                    self.errorMessage = NSLocalizedString("apple_signin_failed", comment: "")
                case .invalidResponse:
                    self.errorMessage = NSLocalizedString("apple_signin_invalid_response", comment: "")
                case .notHandled:
                    self.errorMessage = NSLocalizedString("apple_signin_not_handled", comment: "")
                case .unknown:
                    self.errorMessage = NSLocalizedString("apple_signin_unknown_error", comment: "")
                @unknown default:
                    self.errorMessage = NSLocalizedString("apple_signin_general_error", comment: "")
                }
            } else {
                self.errorMessage = NSLocalizedString("apple_signin_general_error", comment: "")
            }
            
            // errorMessage will trigger the alert in AuthenticationView
        }
    }
}

// MARK: - ASAuthorizationControllerPresentationContextProviding
extension AuthenticationService: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            fatalError("Unable to get window")
        }
        return window
    }

}