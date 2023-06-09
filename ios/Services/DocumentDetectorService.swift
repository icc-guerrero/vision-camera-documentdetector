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
      
      var height = imageSize.width
      var width = imageSize.height
      
        if #available(iOS 11.0, *) {
            VisionRectangleDetector.rectangle(forPixelBuffer: imageBuffer) { (rectangle) in
              
              if let rect = rectangle {
                result.updateValue([Int(width - rect.topLeft.y), Int(height - rect.topLeft.x),
                                    Int(width - rect.topRight.y), Int(height - rect.topRight.x),
                                    Int(width - rect.bottomLeft.y), Int(height - rect.bottomLeft.x),
                                    Int(width - rect.bottomRight.y), Int(height - rect.bottomRight.x),
                                   ], forKey: "bounds")
                result.updateValue(height, forKey: "height")
                result.updateValue(width, forKey: "width")
              }
              
              
            }
        } else {
            let finalImage = CIImage(cvPixelBuffer: imageBuffer)
            CIRectangleDetector.rectangle(forImage: finalImage) { (rectangle) in
              if let rect = rectangle {
                result.updateValue([Int(width - rect.topLeft.y), Int(height - rect.topLeft.x),
                                    Int(width - rect.topRight.y), Int(height - rect.topRight.x),
                                    Int(width - rect.bottomLeft.y), Int(height - rect.bottomLeft.x),
                                    Int(width - rect.bottomRight.y), Int(height - rect.bottomRight.x),
                                   ], forKey: "bounds")
              }
            }
        }
      return result

    }
}
