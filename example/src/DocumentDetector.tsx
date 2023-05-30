/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useState} from 'react';
import {Dimensions, Pressable, StyleSheet, View} from 'react-native';
import {docDetector} from './docDetector';
import DetectedDocument, {Point} from './DetectedDocument';
import Reanimated, {
  Extrapolate,
  interpolate,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

import CameraIcon from '../assets/camera.svg';

const SCREEN_WIDTH = Dimensions.get('window').width - 0;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  cameraButton: {
    marginVertical: 50,
    borderWidth: 3,
    padding: 15,
    borderRadius: 50,
    borderColor: 'white',
  },
});

interface Bounds {
  p1: Point;
  p2: Point;
  p3: Point;
  p4: Point;
}

const DocumentDetector = () => {
  const devices = useCameraDevices('wide-angle-camera');
  const device = devices.back;

  const [docBounds, setDocBounds] = useState<Bounds>({
    p1: {x: 0, y: 0},
    p2: {x: 0, y: 0},
    p3: {x: 0, y: 0},
    p4: {x: 0, y: 0},
  });

  // const frameProcessor = useFrameProcessor(frame => {
  //   'worklet';
  //   const detectedDocument = docDetector(frame);
  //   console.log(detectedDocument);
  //   if (detectedDocument?.bounds) {
  //     const bounds = detectedDocument.bounds;
  //
  //     runOnJS(setDocBounds)({
  //       p1: {x: SCREEN_WIDTH * bounds[0], y: SCREEN_HEIGHT * (1 - bounds[1])},
  //       p2: {x: SCREEN_WIDTH * bounds[2], y: SCREEN_HEIGHT * (1 - bounds[3])},
  //       p3: {x: SCREEN_WIDTH * bounds[4], y: SCREEN_HEIGHT * (1 - bounds[5])},
  //       p4: {x: SCREEN_WIDTH * bounds[6], y: SCREEN_HEIGHT * (1 - bounds[7])},
  //     });
  //   } else {
  //   }
  // }, []);

  if (device == null) {
    return <></>;
  }
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {justifyContent: 'space-between', alignItems: 'center'},
      ]}>
      <ReanimatedCamera
        style={StyleSheet.absoluteFill}
        // frameProcessor={frameProcessor}
        device={device}
        isActive={true}
      />
      <View />
      <View style={StyleSheet.absoluteFill}>
        <DetectedDocument
          screen={{width: SCREEN_WIDTH, height: SCREEN_HEIGHT}}
          p1={docBounds.p1}
          p2={docBounds.p2}
          p3={docBounds.p3}
          p4={docBounds.p4}
        />
      </View>
      <Pressable style={styles.cameraButton}>
        <CameraIcon width={30} height={30} color={'white'} />
      </Pressable>
    </View>
  );
};

export default DocumentDetector;
