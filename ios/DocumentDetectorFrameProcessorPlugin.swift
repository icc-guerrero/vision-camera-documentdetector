import AVKit
import Vision

@objc(DocumentDetectorFrameProcessorPlugin)
 class DocumentDetectorFrameProcessorPlugin: NSObject, FrameProcessorPluginBase {
    @objc
 static func callback(_ frame: Frame!, withArgs args: [Any]!) -> Any! {
     return DocumentDetectorService.detectDocument(frame, withArgs: args)
    }
}
