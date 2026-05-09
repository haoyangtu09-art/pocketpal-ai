import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  resizeImage(uri: string, destPath: string): Promise<string>;
}

// Android-only module; returns null on iOS (Platform.OS check in callers)
export default TurboModuleRegistry.get<Spec>('ImageResize');
