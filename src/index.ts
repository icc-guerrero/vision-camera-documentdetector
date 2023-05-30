import type { Frame } from 'react-native-vision-camera';


export function faceDetector(frame: Frame): any {
  'worklet';
  // @ts-ignore
  return __faceDetector(frame);
}
