# Google Sign-In Setup Guide for AuarAI iOS

## 🚀 **Complete Implementation Steps**

### **Step 1: Add Google Sign-In SDK**

1. **Open Xcode project**: `AuarAI.xcodeproj`
2. **Add Package Dependency**:
   - File → Add Package Dependencies
   - Enter URL: `https://github.com/google/GoogleSignIn-iOS`
   - Version: Latest (7.0.0+)
   - Add to target: `AuarAI`

### **Step 2: Configure Firebase Project**

1. **Firebase Console**: Go to [Firebase Console](https://console.firebase.google.com/)
2. **Select AuarAI project** (or create new one)
3. **Add iOS app**:
   - Bundle ID: `bizhan.AuarAI`
   - App nickname: `AuarAI iOS`
   - Download `GoogleService-Info.plist`

### **Step 3: Add GoogleService-Info.plist**

1. **Drag `GoogleService-Info.plist`** into Xcode project
2. **Ensure it's added to target**: `AuarAI`
3. **Add to project bundle**: Make sure "Add to target" is checked

### **Step 4: Configure URL Scheme**

1. **Open Info.plist** (or Project Settings → Info → URL Types)
2. **Add URL Scheme**:
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
       <dict>
           <key>CFBundleURLName</key>
           <string>GoogleSignIn</string>
           <key>CFBundleURLSchemes</key>
           <array>
               <string>YOUR_REVERSED_CLIENT_ID</string>
           </array>
       </dict>
   </array>
   ```
   
   **Note**: Replace `YOUR_REVERSED_CLIENT_ID` with the value from `GoogleService-Info.plist`

### **Step 5: Update AppDelegate/App File**

Add to `AuarAIApp.swift`:

```swift
import SwiftUI
import GoogleSignIn

@main
struct AuarAIApp: App {
    init() {
        // Configure Google Sign-In
        guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let plist = NSDictionary(contentsOfFile: path),
              let clientId = plist["CLIENT_ID"] as? String else {
            fatalError("GoogleService-Info.plist not found or CLIENT_ID missing")
        }
        
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientId)
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}
```

### **Step 6: Update AuthenticationManager**

Replace the mock implementation in `AuthenticationManager.swift`:

```swift
import GoogleSignIn
import UIKit

func signInWithGoogle() async throws {
    isLoading = true
    defer { isLoading = false }
    
    guard let presentingViewController = await UIApplication.shared.windows.first?.rootViewController else {
        throw AuarAIError.authenticationError("No presenting view controller")
    }
    
    do {
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presentingViewController)
        let user = result.user
        
        // Create Firebase user data to send to backend
        let firebaseUserData = FirebaseUserLogin(
            uid: user.userID ?? "",
            email: user.profile?.email ?? "",
            displayName: user.profile?.name,
            photoURL: user.profile?.imageURL(withDimension: 200)?.absoluteString
        )
        
        // Send to backend
        let response: FirebaseLoginResponse = try await networkService.post(
            data: firebaseUserData,
            endpoint: .socialLogin
        )
        
        // Update local user state
        currentUser = User(
            id: response.user.id,
            username: response.user.email,
            email: response.user.email,
            isPremium: response.user.isPremium
        )
        isAuthenticated = true
        
    } catch {
        isAuthenticated = false
        currentUser = nil
        throw AuarAIError.authenticationError("Google Sign-In failed: \(error.localizedDescription)")
    }
}
```

### **Step 7: Add Required Imports**

Add to top of `AuthenticationManager.swift`:
```swift
import GoogleSignIn
```

### **Step 8: Test Implementation**

1. **Build and run** the app
2. **Tap "Continue with Google"**
3. **Verify Google Sign-In flow works**
4. **Check backend receives proper user data**

---

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"No GoogleService-Info.plist found"**
   - Ensure file is added to project bundle
   - Check target membership

2. **"Invalid client ID"**
   - Verify CLIENT_ID in GoogleService-Info.plist
   - Check URL scheme matches REVERSED_CLIENT_ID

3. **"Sign-in cancelled"**
   - Normal user behavior
   - Handle gracefully in error handling

4. **Backend 405 error**
   - Verify endpoint URL is correct
   - Check backend is deployed with latest changes

---

## ✅ **Verification Checklist**

- [ ] Google Sign-In SDK added via SPM
- [ ] GoogleService-Info.plist added to project
- [ ] URL scheme configured in Info.plist
- [ ] App delegate updated with Google Sign-In configuration
- [ ] AuthenticationManager updated with real implementation
- [ ] Required imports added
- [ ] App builds without errors
- [ ] Google Sign-In flow works end-to-end
- [ ] Backend receives and processes user data correctly

---

## 🎯 **Expected Result**

After completing these steps:
1. ✅ **Real Google Sign-In** - Users see actual Google authentication
2. ✅ **Proper user data** - Real Google account information
3. ✅ **Backend integration** - User data sent to AuarAI backend
4. ✅ **Seamless flow** - Professional authentication experience 