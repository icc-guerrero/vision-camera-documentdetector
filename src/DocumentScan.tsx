import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View, Text, Image } from 'react-native'
import { Camera, CameraRuntimeError, Frame, useCameraDevices, useFrameProcessor, PhotoFile } from 'react-native-vision-camera'
import Reanimated, { runOnJS } from 'react-native-reanimated'
import Step from './models/Step'
import CaptureInfo from './models/CaptureInfo'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import DocumentLayout from './DocumentLayout'
import styles from './styles/styles'
import { Button } from 'react-native-elements'
import DocumentDetectorManager from './native/DocumentDetectorManager'
import DocumentAdjust from './DocumentAdjust'

type DocumentScanProps = {
  onCapture: (path:string)=>void;
};

const MAX_CHANGE_RATIO = 0.02
const NUM_STABLE_CAPTURES = 10

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)
Reanimated.addWhitelistedNativeProps({
  zoom: true,
})

const DocumentScan = ({ onCapture }: DocumentScanProps) => {
  const camera = useRef<Camera>(null)
  const devices = useCameraDevices('wide-angle-camera')
  const cameraPosition = 'back'
  const [captureInfo, setCaptureInfo] = useState<CaptureInfo>({ bounds: [0, 0, 0, 0, 0, 0, 0, 0], width: 0, height: 0, area: 0, previousArea: 0 })
  const [currentStep, setCurrentStep] = useState<string>(Step.CAMERA)
  const [originalCapture, setOriginalCapture] = useState<string|undefined>(undefined)
  const device = devices.back

  const documentDetector = (frame: Frame, camera: string): any[] => {
    // noinspection BadExpressionStatementJS
    'worklet'
    // @ts-expect-error because this function is dynamically injected by VisionCamera
    return __documentDetector(frame, camera)
  }

  useMemo(() => {
    return device?.formats.reduce((prev: any, curr: any) => {
      if (prev != null) {
        return prev
      }
      if (curr.videoHeight === 1080 && curr.videoWidth === 1920) {
        return curr
      }
    }, undefined)
  }, [device?.formats])

  const updateCaptureInfo = (currentInfo: CaptureInfo) => {
    setCaptureInfo((prevState) => {
      return {
        bounds: currentInfo.bounds,
        height: currentInfo.height,
        width: currentInfo.width,
        previousBounds: prevState.bounds,
        area: currentInfo.area,
        counter: (prevState.counter && prevState.counter < NUM_STABLE_CAPTURES) ? prevState.counter + 1 : 1,
        previousArea: (prevState.counter === NUM_STABLE_CAPTURES) ? currentInfo.area : prevState.previousArea,
        areaStable: (prevState.counter !== NUM_STABLE_CAPTURES) ? prevState.areaStable
          : Math.abs((currentInfo.area - prevState.previousArea) / prevState.previousArea) < MAX_CHANGE_RATIO,
      }
    },
    )
  }

  // useEffect(() => {
  //   return () => {
  //     captureInfo.area>0 && captureDocument()
  //   };
  // }, [captureInfo.areaStable]);

  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error)
  }, [])

  const captureDocument = async () => {
    try {
      if (camera) {
        const photo: PhotoFile | undefined = await camera?.current?.takePhoto({
          qualityPrioritization: 'speed',
        })
        if (photo !== undefined) {
          setOriginalCapture(photo.path)
          setCurrentStep(Step.ADJUST)
        }
      }
    } catch (e) {
      console.log('Shit happens', e)
    }
  }

  const documentAdjusted = async () => {
    if (originalCapture) {
      const newPath = await DocumentDetectorManager.transformImage(originalCapture, captureInfo.bounds)
      setOriginalCapture(newPath)
      onCapture(newPath)
    }
  }

  const frameProcessor = useFrameProcessor((frame: Frame) => {
    // noinspection BadExpressionStatementJS
    'worklet'

    const document:any = documentDetector(frame, cameraPosition)
    const currentInfo: CaptureInfo = { bounds: document.bounds, height: document.height, width: document.width, area: document.area }
    console.log(currentInfo)
    runOnJS(updateCaptureInfo)(currentInfo)
  }, [])

  const onAdjust = (newBounds: number[]) => {
    setCaptureInfo({ ...captureInfo, bounds: newBounds })
  }
  const renderAdjust = () => {
    return (
      <View style={[StyleSheet.absoluteFill, { flex: 1 }]}>

        {originalCapture &&
              <Image source={{ uri: originalCapture.startsWith('file://') ? originalCapture : `file://${originalCapture}` }}
                style={[StyleSheet.absoluteFill, { resizeMode: 'cover' }]}
              />}
        <DocumentAdjust bounds={captureInfo.bounds} onAdjust={onAdjust} width={captureInfo.width} height={captureInfo.height} />
        <View style={styles.scanInstruction}>
          <View style={styles.scanInstructionWrapperText}>
            <Text style={styles.scanInstructionText}>Adjust edges if needed</Text>
          </View>
        </View>
        <View style={{ position: 'absolute', bottom: 80, left: 0, right: 0, justifyContent: 'center', flexDirection: 'row' }}>
          <Button
            onPress={() => documentAdjusted()}
            title={'Next'}
            buttonStyle={styles.rotateButtonStyle}
            titleStyle={styles.rotateTextStyle}
          />
        </View>

      </View>
    )
  }
  const renderCamera = () => {
    return (
      <Reanimated.View style={[StyleSheet.absoluteFill]}>
        {device != null ? (
          <View style={StyleSheet.absoluteFill}>
            <ReanimatedCamera
              ref={camera}
              device={device}
              style={[StyleSheet.absoluteFill]}
              isActive={true}
              onError={onError}
              photo={true}
              enableHighQualityPhotos={true}
              frameProcessor={frameProcessor}
              frameProcessorFps={8}
            />
            <View style={styles.scanInstruction}>
              <View style={styles.scanInstructionWrapperText}>
                <Text style={styles.scanInstructionText}>Position the document in the view</Text>
              </View>
            </View>
            <View style={[StyleSheet.absoluteFill]}>
              {captureInfo.bounds[0] !== 0 && <DocumentLayout bounds={captureInfo.bounds} height={captureInfo.height} width={captureInfo.width} areaStable={captureInfo.areaStable}/>}
            </View>

            <View style={styles.buttonsContainer}>
              {/* Back */}
              {/* <RoundButton */}
              {/*  size={62} */}
              {/*  icon={<Icon name="camera" size={31} color="white"/>} */}
              {/*  onPress={() => captureDocument()} */}
              {/*  buttonStyle={cameraStyle.bottomButton} */}
              {/* /> */}

              <Button
                onPress={() => captureDocument()}
                buttonStyle={styles.captureButton}
                icon={<Icon name="camera" size={31} color="white"/>}
              />

            </View>
          </View>
        ) : (
          <ActivityIndicator size={'large'}/>
        )}
      </Reanimated.View>
    )
  }

  return (
    <View style={[StyleSheet.absoluteFill]}>
      { currentStep === Step.CAMERA && renderCamera()}
      { currentStep === Step.ADJUST && renderAdjust()}
    </View>
  )
}

export default DocumentScan
