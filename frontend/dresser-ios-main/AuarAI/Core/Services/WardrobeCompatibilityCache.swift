//
//  WardrobeCompatibilityCache.swift
//  AuarAI
//
//  Created by AuarAI on 01.07.2025.
//

import Foundation

@MainActor
final class WardrobeCompatibilityCache: ObservableObject {
    
    // MARK: - Singleton
    static let shared = WardrobeCompatibilityCache()
    
    // MARK: - Properties
    @Published var cachedResult: WardrobeCompatibilityResult?
    @Published var isLoading = false
    
    private let userDefaults = UserDefaults.standard
    private let cacheKey = "wardrobe_compatibility_cache"
    private let cacheTimestampKey = "wardrobe_compatibility_timestamp"
    private let bodyAnalysisHashKey = "body_analysis_hash"
    private let wardrobeHashKey = "wardrobe_hash"
    
    // MARK: - Initialization
    private init() {
        loadCachedResult()
    }
    
    // MARK: - Public Methods
    
    /// Получить кэшированный результат или выполнить новый анализ
    func getCompatibilityResult(
        clothingService: ClothingService,
        bodyAnalysisService: BodyAnalysisService,
        forceRefresh: Bool = false
    ) async throws -> WardrobeCompatibilityResult {
        
        // Проверяем, нужно ли обновить кэш
        let shouldRefresh = forceRefresh || shouldRefreshCache(
            clothingService: clothingService,
            bodyAnalysisService: bodyAnalysisService
        )
        
        if !shouldRefresh, let cached = cachedResult {
            print("📱 Using cached wardrobe compatibility result")
            return cached
        }
        
        // Выполняем новый анализ
        print("🔄 Performing new wardrobe compatibility analysis")
        isLoading = true
        
        do {
            let result = try await clothingService.analyzeWardrobeCompatibility()
            
            // Сохраняем результат в кэш
            await cacheResult(
                result,
                clothingService: clothingService,
                bodyAnalysisService: bodyAnalysisService
            )
            
            isLoading = false
            return result
            
        } catch {
            isLoading = false
            throw error
        }
    }
    
    /// Принудительно очистить кэш (например, при изменении фото анализа тела)
    func invalidateCache() {
        print("🗑️ Invalidating wardrobe compatibility cache")
        cachedResult = nil
        userDefaults.removeObject(forKey: cacheKey)
        userDefaults.removeObject(forKey: cacheTimestampKey)
        userDefaults.removeObject(forKey: bodyAnalysisHashKey)
        userDefaults.removeObject(forKey: wardrobeHashKey)
    }
    
    /// Обновить кэш при изменении гардероба
    func invalidateCacheForWardrobeChange() {
        print("👔 Invalidating cache due to wardrobe change")
        invalidateCache()
    }
    
    /// Обновить кэш при изменении анализа тела
    func invalidateCacheForBodyAnalysisChange() {
        print("🧍 Invalidating cache due to body analysis change")
        invalidateCache()
    }
    
    // MARK: - Private Methods
    
    private func shouldRefreshCache(
        clothingService: ClothingService,
        bodyAnalysisService: BodyAnalysisService
    ) -> Bool {
        
        // Если нет кэшированного результата
        guard cachedResult != nil else { return true }
        
        // Проверяем хэш гардероба
        let currentWardrobeHash = generateWardrobeHash(clothingService.clothingItems)
        let cachedWardrobeHash = userDefaults.string(forKey: wardrobeHashKey)
        
        if currentWardrobeHash != cachedWardrobeHash {
            print("👔 Wardrobe changed, cache invalidated")
            return true
        }
        
        // Проверяем хэш анализа тела
        let currentBodyAnalysisHash = generateBodyAnalysisHash(bodyAnalysisService.analysisResults)
        let cachedBodyAnalysisHash = userDefaults.string(forKey: bodyAnalysisHashKey)
        
        if currentBodyAnalysisHash != cachedBodyAnalysisHash {
            print("🧍 Body analysis changed, cache invalidated")
            return true
        }
        
        // Проверяем возраст кэша (максимум 24 часа)
        let cacheTimestamp = userDefaults.double(forKey: cacheTimestampKey)
        let cacheAge = Date().timeIntervalSince1970 - cacheTimestamp
        let maxCacheAge: TimeInterval = 24 * 60 * 60 // 24 часа
        
        if cacheAge > maxCacheAge {
            print("⏰ Cache expired (age: \(Int(cacheAge/3600)) hours)")
            return true
        }
        
        return false
    }
    
    private func cacheResult(
        _ result: WardrobeCompatibilityResult,
        clothingService: ClothingService,
        bodyAnalysisService: BodyAnalysisService
    ) async {
        
        cachedResult = result
        
        // Сохраняем результат
        if let data = try? JSONEncoder().encode(result) {
            userDefaults.set(data, forKey: cacheKey)
        }
        
        // Сохраняем временную метку
        userDefaults.set(Date().timeIntervalSince1970, forKey: cacheTimestampKey)
        
        // Сохраняем хэши для отслеживания изменений
        let wardrobeHash = generateWardrobeHash(clothingService.clothingItems)
        let bodyAnalysisHash = generateBodyAnalysisHash(bodyAnalysisService.analysisResults)
        
        userDefaults.set(wardrobeHash, forKey: wardrobeHashKey)
        userDefaults.set(bodyAnalysisHash, forKey: bodyAnalysisHashKey)
        
        print("💾 Cached wardrobe compatibility result")
    }
    
    private func loadCachedResult() {
        guard let data = userDefaults.data(forKey: cacheKey),
              let result = try? JSONDecoder().decode(WardrobeCompatibilityResult.self, from: data) else {
            return
        }
        
        cachedResult = result
        print("📱 Loaded cached wardrobe compatibility result")
    }
    
    private func generateWardrobeHash(_ items: [ClothingItem]) -> String {
        let itemsData = items.map { "\($0.id)-\($0.name)-\($0.category ?? "")-\($0.color ?? "")" }
            .sorted()
            .joined(separator: "|")
        
        return String(itemsData.hashValue)
    }
    
    private func generateBodyAnalysisHash(_ analysis: BodyAnalysisResult?) -> String {
        guard let analysis = analysis else { return "no_analysis" }
        
        let analysisData = [
            analysis.bodyType ?? "",
            analysis.recommendedColors?.joined(separator: ",") ?? "",
            analysis.styleRecommendations?.joined(separator: ",") ?? "",
            String(analysis.confidence ?? 0)
        ].joined(separator: "|")
        
        return String(analysisData.hashValue)
    }
}