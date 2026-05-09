/**
 * @format
 */

// Import URL polyfill for React Native/Hermes compatibility
import 'react-native-url-polyfill/auto';

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {saveCrashLog} from './src/utils/crashLog';

// Global uncaught JS error handler — persists crash info to AsyncStorage
// so it can be displayed to the user on next app launch.
// ErrorUtils is a global set by React Native, not a named export.
const ErrorUtils = global.ErrorUtils;
if (ErrorUtils) {
  const prevHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    try {
      const message =
        error instanceof Error ? error.message : String(error ?? 'unknown');
      const stack =
        error instanceof Error ? error.stack?.slice(0, 2000) : undefined;
      saveCrashLog({message, stack, context: `globalHandler isFatal=${isFatal}`});
    } catch {
      // swallow — don't let the error handler itself crash
    }
    if (prevHandler) {
      prevHandler(error, isFatal);
    }
  });
}

AppRegistry.registerComponent(appName, () => App);
