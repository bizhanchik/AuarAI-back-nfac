//
//  WeatherView.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import SwiftUI

struct WeatherView: View {
    var body: some View {
        VStack {
            Image(systemName: "cloud.sun.fill")
                .font(.system(size: 80))
                .foregroundColor(.orange)
            Text(NSLocalizedString("weather_information", comment: ""))
                .font(.largeTitle)
                .fontWeight(.bold)
            Text(NSLocalizedString("weather_description", comment: ""))
                .font(.body)
                .foregroundColor(.secondary)
        }
        .navigationTitle(NSLocalizedString("weather", comment: ""))
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    WeatherView()
}