//
//  DocumentDetectorManager.swift
//  vision-camera-documentdetector
//
//  Created by guerrero@unicc.org on 14/6/23.
//

@objc(DocumentDetectorManager)
class DocumentDetectorManager: NSObject {
    
  func transformAndCropImage(image: UIImage, topLeft: CGPoint, topRight: CGPoint, bottomLeft: CGPoint, bottomRight: CGPoint) -> UIImage? {
      // Calcular el rectángulo de destino para la imagen transformada
      let minX = min(topLeft.x, bottomLeft.x)
      let maxX = max(topRight.x, bottomRight.x)
      let minY = min(topLeft.y, topRight.y)
      let maxY = max(bottomLeft.y, bottomRight.y)

      let width = maxX - minX
      let height = maxY - minY
      let size = CGSize(width: width, height: height)
      let destRect = CGRect(origin: CGPoint.zero, size: size)

      // Crear la transformación afín
      let transform = CGAffineTransform(a: topLeft.x - minX,
                                        b: topRight.x - minX,
                                        c: topLeft.y - minY,
                                        d: bottomLeft.y - minY,
                                        tx: minX,
                                        ty: minY)

      // Crear un nuevo contexto de gráficos basado en el rectángulo de destino
      UIGraphicsBeginImageContextWithOptions(size, false, image.scale)

      // Aplicar la transformación al contexto de gráficos
      guard let context = UIGraphicsGetCurrentContext() else {
          return nil
      }
      context.concatenate(transform)

      // Dibujar la imagen original en el contexto de gráficos transformado
      image.draw(at: CGPoint.zero)

      // Obtener la imagen resultante del contexto de gráficos
      let transformedImage = UIGraphicsGetImageFromCurrentImageContext()

      // Finalizar el contexto de gráficos
      UIGraphicsEndImageContext()

      // Recortar la imagen transformada según el rectángulo de destino
      if let cgImage = transformedImage?.cgImage?.cropping(to: destRect) {
          return UIImage(cgImage: cgImage)
      }

      return nil
  }
  
  func defaultQuad(forImage image: UIImage) -> Quadrilateral {
      let topLeft = CGPoint(x: image.size.width / 3.0, y: image.size.height / 3.0)
      let topRight = CGPoint(x: 2.0 * image.size.width / 3.0, y: image.size.height / 3.0)
      let bottomRight = CGPoint(x: 2.0 * image.size.width / 3.0, y: 2.0 * image.size.height / 3.0)
      let bottomLeft = CGPoint(x: image.size.width / 3.0, y: 2.0 * image.size.height / 3.0)
      
      let quad = Quadrilateral(topLeft: topLeft, topRight: topRight, bottomRight: bottomRight, bottomLeft: bottomLeft)
      
      return quad
  }
  
  func calculateSizeForPoints(point1: CGPoint, point2: CGPoint, point3: CGPoint, point4: CGPoint) -> CGSize {
      let minX = min(point1.x, point2.x, point3.x, point4.x)
      let maxX = max(point1.x, point2.x, point3.x, point4.x)
      let minY = min(point1.y, point2.y, point3.y, point4.y)
      let maxY = max(point1.y, point2.y, point3.y, point4.y)
      
      let width = maxX - minX
      let height = maxY - minY
      
      return CGSize(width: width, height: height)
  }
  
  func createRectangleWithPoints(point1: CGPoint, point2: CGPoint, point3: CGPoint, point4: CGPoint) -> CGRect {
      let minX = min(point1.x, point2.x, point3.x, point4.x)
      let minY = min(point1.y, point2.y, point3.y, point4.y)
      let maxX = max(point1.x, point2.x, point3.x, point4.x)
      let maxY = max(point1.y, point2.y, point3.y, point4.y)
      
      let width = maxX - minX
      let height = maxY - minY
      
      return CGRect(x: minX, y: minY, width: width, height: height)
  }
  
  func createFileName() -> String {
    let currentTimeInMilliseconds = Int64(1000 * Date().timeIntervalSince1970)
    let fileName = "document_scan" + "_" + String(currentTimeInMilliseconds) + ".jpeg"
    print("file name ==> \(fileName)")
    return fileName
  }
  
  func deleteImage(atPath path: String) -> Bool {
    let fileManager = FileManager.default
    
    do {
        try fileManager.removeItem(atPath: path)
        return true
    } catch {
        return false
    }
  }
  
  func saveImage(imageName: String, resultImage:UIImage) -> String{
    //create an instance of the FileManager
    let fileManager = FileManager.default
    //get the image path
    let imagePath = (NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0] as NSString).appendingPathComponent(imageName)
    //get the image we took with camera
    let image = resultImage
    //get the PNG data for this image
    let data = image.jpegData(compressionQuality: 0.8)
    //store it in the document directory
    fileManager.createFile(atPath: imagePath as String, contents: data, attributes: nil)
    return imagePath
  }
  
  @objc(rotateImage:resolve:reject:)
  func rotateImage(_ name: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    if var image = UIImage(named: name) {
      if let rotatedImage = image.rotate() as? UIImage
      {
          let imagePath = self.saveImage(imageName: self.createFileName(), resultImage: rotatedImage)
          self.deleteImage(atPath: name)
          resolve(imagePath)
      }
      else {
        resolve(name)
      }
    }
  }
  
  @objc(transformImage:bounds:resolve:reject:)
  func transformImage(_ name: String, bounds: NSArray, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    DispatchQueue.main.async {
        let intBounds: [Int] = bounds.map { return $0 as! Int }
        
        if var image = UIImage(named: name) {
      
          let topLeft = CGPoint(x: intBounds[0], y: intBounds[1])
          let topRight = CGPoint(x: intBounds[2], y: intBounds[3])
          let bottomLeft = CGPoint(x: intBounds[4], y: intBounds[5])
          let bottomRight = CGPoint(x: intBounds[6], y: intBounds[7])
          
          let quad = Quadrilateral(topLeft: topLeft, topRight: topRight, bottomRight: bottomRight, bottomLeft: bottomLeft)
      
          let ciImage = CIImage(image: image)
          
          let cgOrientation = CGImagePropertyOrientation(image.imageOrientation)
          let orientedImage = ciImage!.oriented(forExifOrientation: Int32(cgOrientation.rawValue))
          let ooo = UIImage.from(ciImage: orientedImage)
          let scaledQuad = quad.scale(CGSize(width: 1080, height: 1920), image.size)
          
          // Cropped Image
          var cartesianScaledQuad = scaledQuad.toCartesian(withHeight: image.size.height)
          cartesianScaledQuad.reorganize()
          
          let filteredImage = orientedImage.applyingFilter("CIPerspectiveCorrection", parameters: [
              "inputTopLeft": CIVector(cgPoint: cartesianScaledQuad.bottomLeft),
              "inputTopRight": CIVector(cgPoint: cartesianScaledQuad.bottomRight),
              "inputBottomLeft": CIVector(cgPoint: cartesianScaledQuad.topLeft),
              "inputBottomRight": CIVector(cgPoint: cartesianScaledQuad.topRight)
              ])
          
          let croppedImage = UIImage.from(ciImage: filteredImage)
          croppedImage.jpegData(compressionQuality: 0.8)
          
          let imagePath = self.saveImage(imageName: self.createFileName(), resultImage: croppedImage)
          resolve(imagePath)
      }
        
    }
 }


}
