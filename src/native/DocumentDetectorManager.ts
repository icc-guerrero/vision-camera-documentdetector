import { NativeModules } from 'react-native'
const { DocumentDetectorManager } = NativeModules
interface DocumentDetectorInterface {
  transformImage(name: string, bounds: number[]): Promise<string>;
  rotateImage(name: string): Promise<string>;
}
export default DocumentDetectorManager as DocumentDetectorInterface
