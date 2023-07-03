#import <Foundation/Foundation.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <React/RCTBridgeModule.h>

@interface VISION_EXPORT_SWIFT_FRAME_PROCESSOR(documentDetector, DocumentDetectorFrameProcessorPlugin)
@end


@interface RCT_EXTERN_MODULE(DocumentDetectorManager, NSObject)
RCT_EXTERN_METHOD(transformImage:(NSString *)name bounds: (NSArray*) bounds resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject);

RCT_EXTERN_METHOD(rotateImage:(NSString *)name resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject);
@end


