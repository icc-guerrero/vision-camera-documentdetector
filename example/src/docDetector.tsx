import type {Frame} from 'react-native-vision-camera';

/**
 * Scans OCR.
 */

export function docDetector(frame: Frame): any {
  'worklet';
  // @ts-ignore
  return __docDetector(frame);
}
