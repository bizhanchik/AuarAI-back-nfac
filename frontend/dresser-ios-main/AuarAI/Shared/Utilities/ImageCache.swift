import SwiftUI
import CryptoKit

// MARK: - ImageCache
/// Thread-safe image cache that stores images in memory and persists them to disk under the Caches directory.
/// The key is typically the image URL string.
actor ImageCache {
    static let shared = ImageCache()

    private let memoryCache = NSCache<NSString, UIImage>()
    private let fileManager = FileManager.default
    private let directoryURL: URL

    init() {
        let base = fileManager.urls(for: .cachesDirectory, in: .userDomainMask).first!
        directoryURL = base.appendingPathComponent("AuarAIImageCache", isDirectory: true)
        if !fileManager.fileExists(atPath: directoryURL.path) {
            try? fileManager.createDirectory(at: directoryURL, withIntermediateDirectories: true)
        }
        // Limit in-memory cache to ~50 images (~25MB depending on size)
        memoryCache.countLimit = 50
    }

    func image(forKey key: String) -> UIImage? {
        if let img = memoryCache.object(forKey: key as NSString) { return img }
        let path = pathForKey(key)
        guard let data = try? Data(contentsOf: path), let img = UIImage(data: data) else { return nil }
        memoryCache.setObject(img, forKey: key as NSString)
        return img
    }

    func insert(_ image: UIImage, forKey key: String) {
        memoryCache.setObject(image, forKey: key as NSString)
        let path = pathForKey(key)
        if let data = image.jpegData(compressionQuality: 0.9) {
            try? data.write(to: path, options: [.atomic])
        }
    }

    private func pathForKey(_ key: String) -> URL {
        // Use SHA256 to generate a safe unique filename
        let hash = SHA256.hash(data: Data(key.utf8)).compactMap { String(format: "%02x", $0) }.joined()
        return directoryURL.appendingPathComponent(hash).appendingPathExtension("jpg")
    }
} 