//
//  LocationManager.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import Foundation
import CoreLocation
import SwiftUI

@MainActor
final class LocationManager: NSObject, ObservableObject {
    
    // MARK: - Properties
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var currentLocation: CLLocationCoordinate2D?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let locationManager = CLLocationManager()
    
    // Default coordinates (Almaty) as fallback
    private let defaultCoordinates = CLLocationCoordinate2D(latitude: 43.2220, longitude: 76.8512)
    
    // MARK: - Initialization
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        authorizationStatus = locationManager.authorizationStatus
    }
    
    // MARK: - Public Methods
    
    /// Request location permission
    func requestLocationPermission() {
        switch authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .denied, .restricted:
            // Show alert to go to settings
            errorMessage = "location_permission_denied".localized
        case .authorizedWhenInUse, .authorizedAlways:
            getCurrentLocation()
        @unknown default:
            break
        }
    }
    
    /// Get current location
    func getCurrentLocation() {
        guard authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways else {
            requestLocationPermission()
            return
        }
        
        isLoading = true
        errorMessage = nil
        locationManager.requestLocation()
    }
    
    /// Get coordinates to use (user location or default)
    func getCoordinates() -> CLLocationCoordinate2D {
        return currentLocation ?? defaultCoordinates
    }
    
    /// Check if we have user's actual location
    var hasUserLocation: Bool {
        return currentLocation != nil
    }
    
    /// Get location display name
    func getLocationDisplayName() -> String {
        if hasUserLocation {
            return "current_location".localized
        } else {
            return "default_location".localized
        }
    }
}

// MARK: - CLLocationManagerDelegate
extension LocationManager: CLLocationManagerDelegate {
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        isLoading = false
        
        guard let location = locations.last else {
            errorMessage = "location_unavailable".localized
            return
        }
        
        currentLocation = location.coordinate
        errorMessage = nil
        
        print("✅ Location updated: \(location.coordinate.latitude), \(location.coordinate.longitude)")
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        isLoading = false
        errorMessage = "location_error".localized
        
        print("❌ Location error: \(error.localizedDescription)")
        
        // Use default coordinates as fallback
        if currentLocation == nil {
            currentLocation = defaultCoordinates
            print("📍 Using default coordinates: Almaty")
        }
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        
        switch authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            getCurrentLocation()
        case .denied, .restricted:
            errorMessage = "location_permission_denied".localized
            // Use default coordinates
            currentLocation = defaultCoordinates
        case .notDetermined:
            break
        @unknown default:
            break
        }
    }
}