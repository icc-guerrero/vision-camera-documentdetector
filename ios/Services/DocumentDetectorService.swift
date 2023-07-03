//
//  VisionCameraDocumentDetectorService.swift
//  vision-camera-documentdetector
//
//  Created by Andres Guerrero on 08/06/23.
//

import Foundation
import AVKit
import Vision


public struct DocumentBounds {
    var top: Int
    var left: Int
    var right: Int
    var bottom: Int
}

public struct ImageDocumentFeatures{
    public let width: Int
    public let height: Int
}

public class DocumentDetectorService: NSObject {
    
   
    public static func detectDocument(_ frame: Frame!, withArgs args: [Any]!) -> [String:Any] {

      guard let imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
        return [:]
      }
      let imageSize = CGSize(width: CVPixelBufferGetWidth(imageBuffer), height: CVPixelBufferGetHeight(imageBuffer))


      var result =  [String:Any]()
      result.updateValue(imageSize.height, forKey: "height")
      result.updateValue(imageSize.width, forKey: "width")
      result.updateValue([0,0,0,0,0,0,0,0], forKey: "bounds")
      
      var height = imageSize.height
      var width = imageSize.width
      
        if #available(iOS 11.0, *) {
            VisionRectangleDetector.rectangle(forPixelBuffer: imageBuffer) { (rectangle) in
              
              if let rect = rectangle {
                result.updateValue([Int(rect.topLeft.x), Int(height - rect.topLeft.y),
                                    Int(rect.topRight.x), Int(height - rect.topRight.y),
                                    Int(rect.bottomLeft.x), Int(height - rect.bottomLeft.y),
                                    Int(rect.bottomRight.x), Int(height - rect.bottomRight.y),
                                   ], forKey: "bounds")
                result.updateValue(width, forKey: "height")
                result.updateValue(height, forKey: "width")
                result.updateValue(Int(rect.area()), forKey: "area")
              }
              
              
            }
        } else {
            let finalImage = CIImage(cvPixelBuffer: imageBuffer)
            CIRectangleDetector.rectangle(forImage: finalImage) { (rectangle) in
              if let rect = rectangle {
                result.updateValue([Int(rect.topLeft.x), Int(height - rect.topLeft.y),
                                    Int(rect.topRight.x), Int(height - rect.topRight.y),
                                    Int(rect.bottomLeft.x), Int(height - rect.bottomLeft.y),
                                    Int(rect.bottomRight.x), Int(height - rect.bottomRight.y),
                                   ], forKey: "bounds")
                result.updateValue(width, forKey: "height")
                result.updateValue(height, forKey: "width")
                result.updateValue(Int(rect.area()), forKey: "area")
              }
            }
        }
      return result

    }
}
