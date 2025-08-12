import SwiftUI

@MainActor
final class ImageLoader: ObservableObject {
    @Published var image: UIImage?
    private var urlString: String?

    func load(from urlString: String?) {
        guard self.urlString != urlString else { return }
        self.urlString = urlString
        Task { await fetch() }
    }

    private func fetch() async {
        guard let urlString = urlString, let url = URL(string: urlString) else { return }
        if let cached = await ImageCache.shared.image(forKey: urlString) {
            image = cached; return
        }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let uiImg = UIImage(data: data) else { return }
            await ImageCache.shared.insert(uiImg, forKey: urlString)
            image = uiImg
        } catch {
            print("Image download error: \(error)")
        }
    }
}

struct CachedImageView<Placeholder: View>: View {
    private let urlString: String?
    private let placeholder: Placeholder
    private let aspectRatio: ContentMode

    @StateObject private var loader = ImageLoader()

    init(urlString: String?, aspectRatio: ContentMode = .fill, @ViewBuilder placeholder: () -> Placeholder) {
        self.urlString = urlString
        self.placeholder = placeholder()
        self.aspectRatio = aspectRatio
    }

    var body: some View {
        content
            .onAppear { loader.load(from: urlString) }
    }

    @ViewBuilder private var content: some View {
        if let uiImg = loader.image {
            Image(uiImage: uiImg)
                .resizable()
                .aspectRatio(contentMode: aspectRatio)
        } else {
            placeholder
        }
    }
} 