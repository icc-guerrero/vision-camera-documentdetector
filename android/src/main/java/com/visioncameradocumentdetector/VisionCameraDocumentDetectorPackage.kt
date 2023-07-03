package com.visioncameradocumentdetector

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin
import java.util.*


class VisionCameraDocumentDetectorPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    FrameProcessorPlugin.register(VisionCameraDocumentDetectorPlugin())
    return listOf(DocumentDetectorManager(reactContext)).toMutableList()
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
