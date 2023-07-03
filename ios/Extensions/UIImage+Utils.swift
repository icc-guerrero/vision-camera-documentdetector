

import Foundation

extension UIImage {
  
    func flattenImage(topLeft: CGPoint, topRight: CGPoint, bottomLeft: CGPoint, bottomRight: CGPoint) -> CIImage {
        let docImage = CIImage(image:self)
        let rect = CGRect(origin: CGPoint.zero, size: self.size)
        let perspectiveCorrection = CIFilter(name: "CIPerspectiveCorrection")!
        perspectiveCorrection.setValue(CIVector(cgPoint: self.cartesianForPoint(point: topLeft, extent: rect)), forKey: "inputTopLeft")
        perspectiveCorrection.setValue(CIVector(cgPoint: self.cartesianForPoint(point: topRight, extent: rect)), forKey: "inputTopRight")
        perspectiveCorrection.setValue(CIVector(cgPoint: self.cartesianForPoint(point: bottomLeft, extent: rect)), forKey: "inputBottomLeft")
        perspectiveCorrection.setValue(CIVector(cgPoint: self.cartesianForPoint(point: bottomRight, extent: rect)), forKey: "inputBottomRight")
        perspectiveCorrection.setValue(docImage, forKey: kCIInputImageKey)
        
        return perspectiveCorrection.outputImage!
    }
    
  
    func cartesianForPoint(point:CGPoint,extent:CGRect) -> CGPoint {
       // return CGPoint(x: point.x,y: extent.height - point.y)
      return point
    }
  
    /// Creates a UIImage from the specified CIImage.
    static func from(ciImage: CIImage) -> UIImage {
        if let cgImage = CIContext(options: nil).createCGImage(ciImage, from: ciImage.extent) {
            return UIImage(cgImage: cgImage)
        } else {
            return UIImage(ciImage: ciImage, scale: 1.0, orientation: .up)
        }
    }
  
    func rotate() -> UIImage? {
        guard let cgImage = self.cgImage else { return nil }
        
        let rotationInRadians = CGFloat.pi / 2
        let transform = CGAffineTransform(rotationAngle: rotationInRadians)
        let cgImageSize = CGSize(width: cgImage.width, height: cgImage.height)
        var rect = CGRect(origin: .zero, size: cgImageSize).applying(transform)
        rect.origin = .zero
        
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        
        let renderer = UIGraphicsImageRenderer(size: rect.size, format: format)
        
        let image = renderer.image { renderContext in
            renderContext.cgContext.translateBy(x: rect.midX, y: rect.midY)
            renderContext.cgContext.rotate(by: rotationInRadians)
            
            let x = 1.0
            let y = -1.0
            renderContext.cgContext.scaleBy(x: CGFloat(x), y: CGFloat(y))
            
            let drawRect = CGRect(origin: CGPoint(x: -cgImageSize.width / 2.0, y: -cgImageSize.height / 2.0), size: cgImageSize)
            renderContext.cgContext.draw(cgImage, in: drawRect)
        }
        
        return image
    }
  
    
    /// Draws a new cropped and scaled (zoomed in) image.
    ///
    /// - Parameters:
    ///   - point: The center of the new image.
    ///   - scaleFactor: Factor by which the image should be zoomed in.
    ///   - size: The size of the rect the image will be displayed in.
    /// - Returns: The scaled and cropped image.
    func scaledImage(atPoint point: CGPoint, scaleFactor: CGFloat, targetSize size: CGSize) -> UIImage? {
        guard let cgImage = self.cgImage else { return nil }
        
        let scaledSize = CGSize(width: size.width / scaleFactor, height: size.height / scaleFactor)
        let midX = point.x - scaledSize.width / 2.0
        let midY = point.y - scaledSize.height / 2.0
        let newRect = CGRect(x: midX, y: midY, width: scaledSize.width, height: scaledSize.height)
        
        guard let croppedImage = cgImage.cropping(to: newRect) else {
            return nil
        }
        
        return UIImage(cgImage: croppedImage)
    }
    
    /// Scales the image to the specified size in the RGB color space.
    ///
    /// - Parameters:
    ///   - scaleFactor: Factor by which the image should be scaled.
    /// - Returns: The scaled image.
    func scaledImage(scaleFactor: CGFloat) -> UIImage? {
        guard let cgImage = self.cgImage else { return nil }
        
        let customColorSpace = CGColorSpaceCreateDeviceRGB()
        
        let width = CGFloat(cgImage.width) * scaleFactor
        let height = CGFloat(cgImage.height) * scaleFactor
        let bitsPerComponent = cgImage.bitsPerComponent
        let bytesPerRow = cgImage.bytesPerRow
        let bitmapInfo = cgImage.bitmapInfo.rawValue
        
        guard let context = CGContext(data: nil, width: Int(width), height: Int(height), bitsPerComponent: bitsPerComponent, bytesPerRow: bytesPerRow, space: customColorSpace, bitmapInfo: bitmapInfo) else { return nil }
        
        context.interpolationQuality = .high
        context.draw(cgImage, in: CGRect(origin: .zero, size: CGSize(width: width, height: height)))
        
        return context.makeImage().flatMap { UIImage(cgImage: $0) }
    }
    
    /// Returns the data for the image in the PDF format
    func pdfData() -> Data? {
        // Typical Letter PDF page size and margins
        let pageBounds = CGRect(x: 0, y: 0, width: 595, height: 842)
        let margin: CGFloat = 40
        
        let imageMaxWidth = pageBounds.width - (margin * 2)
        let imageMaxHeight = pageBounds.height - (margin * 2)
        
        let image = scaledImage(scaleFactor: size.scaleFactor(forMaxWidth: imageMaxWidth, maxHeight: imageMaxHeight)) ?? self
        let renderer = UIGraphicsPDFRenderer(bounds: pageBounds)

        let data = renderer.pdfData { (ctx) in
            ctx.beginPage()
            
            ctx.cgContext.interpolationQuality = .high

            image.draw(at: CGPoint(x: margin, y: margin))
        }
        
        return data
    }
  
    /// Function gathered from [here](https://stackoverflow.com/questions/44462087/how-to-convert-a-uiimage-to-a-cvpixelbuffer) to convert UIImage to CVPixelBuffer
    ///
    /// - Returns: new [CVPixelBuffer](apple-reference-documentation://hsVf8OXaJX)
    func pixelBuffer() -> CVPixelBuffer? {
        let attrs = [kCVPixelBufferCGImageCompatibilityKey: kCFBooleanTrue, kCVPixelBufferCGBitmapContextCompatibilityKey: kCFBooleanTrue] as CFDictionary
        var pixelBufferOpt: CVPixelBuffer?
        let status = CVPixelBufferCreate(kCFAllocatorDefault, Int(self.size.width), Int(self.size.height), kCVPixelFormatType_32ARGB, attrs, &pixelBufferOpt)
        guard status == kCVReturnSuccess, let pixelBuffer = pixelBufferOpt else {
            return nil
        }

        CVPixelBufferLockBaseAddress(pixelBuffer, CVPixelBufferLockFlags(rawValue: 0))
        let pixelData = CVPixelBufferGetBaseAddress(pixelBuffer)

        let rgbColorSpace = CGColorSpaceCreateDeviceRGB()
        guard let context = CGContext(data: pixelData, width: Int(self.size.width), height: Int(self.size.height), bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer), space: rgbColorSpace, bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue) else {
          return nil
        }

        context.translateBy(x: 0, y: self.size.height)
        context.scaleBy(x: 1.0, y: -1.0)

        UIGraphicsPushContext(context)
        self.draw(in: CGRect(x: 0, y: 0, width: self.size.width, height: self.size.height))
        UIGraphicsPopContext()
        CVPixelBufferUnlockBaseAddress(pixelBuffer, CVPixelBufferLockFlags(rawValue: 0))

        return pixelBuffer
    }
}
