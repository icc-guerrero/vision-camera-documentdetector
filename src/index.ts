import type { Frame } from 'react-native-vision-camera'

export function faceDetector (frame: Frame): any {
  'worklet'
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return __faceDetector(frame)
}
