import * as React from 'react';
import {Alert, Dimensions, StyleSheet} from 'react-native';

import {observer} from 'mobx-react';
import {
  readCrashLogs,
  clearCrashLogs,
  clearCrashLogsByMessagePrefix,
} from './src/utils/crashLog';
import {NavigationContainer} from '@react-navigation/native';
import {Provider as PaperProvider} from 'react-native-paper';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import {
  gestureHandlerRootHOC,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import {ttsStore, uiStore} from './src/store';
import {useTheme} from './src/hooks';
import {useDeepLinking} from './src/hooks/useDeepLinking';
import {Theme} from './src/utils/types';

import {l10n, initLocale} from './src/locales';
import {L10nContext} from './src/utils';
import {ROUTES} from './src/utils/navigationConstants';

import {
  SidebarContent,
  ModelsHeaderRight,
  HeaderLeft,
  AppWithMigration,
  TTSSetupSheet,
  WelcomeDialog,
} from './src/components';
import {AutomationBridge} from './src/__automation__';
import {
  ChatScreen,
  ModelsScreen,
  SettingsScreen,
  AboutScreen,

  // Dev tools screen. Only available in debug mode.
  DevToolsScreen,
} from './src/screens';

// Check if app is in debug mode
const isDebugMode = __DEV__;

const Drawer = createDrawerNavigator();

const screenWidth = Dimensions.get('window').width;

// Component that handles deep linking - must be inside NavigationContainer
const DeepLinkHandler = () => {
  useDeepLinking();
  return null;
};

const App = observer(() => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const currentL10n = l10n[uiStore.language];

  // Initialize locale with the current language
  React.useEffect(() => {
    initLocale(uiStore.language);
  }, []);

  // Initialize TTS store (memory gate + AppState/session listeners).
  // Fire-and-forget: `init()` is idempotent and swallows its own errors.
  React.useEffect(() => {
    ttsStore.init().catch(() => {
      // init() swallows its own errors; catch to satisfy no-floating-promises.
    });
  }, []);

  // Check for crash logs from previous app session and show dialog
  React.useEffect(() => {
    let cancelled = false;
    const checkCrashLogs = async () => {
      try {
        const logs = await readCrashLogs();
        const displayLogs = logs.filter(
          log =>
            !log.message.startsWith('BackgroundStore.copyUriToLocal failed'),
        );
        if (displayLogs.length !== logs.length) {
          await clearCrashLogsByMessagePrefix(
            'BackgroundStore.copyUriToLocal failed',
          );
        }
        if (cancelled || displayLogs.length === 0) return;
        const latest = displayLogs[displayLogs.length - 1];
        const time = new Date(latest.timestamp).toLocaleString();
        const body =
          `Time: ${time}\n\n` +
          `Error: ${latest.message}\n` +
          (latest.stack ? `\nStack:\n${latest.stack.slice(0, 500)}` : '') +
          (latest.context ? `\nContext: ${latest.context}` : '') +
          (displayLogs.length > 1
            ? `\n\n(+ ${displayLogs.length - 1} more errors)`
            : '');
        Alert.alert(
          'App 上次崩溃了',
          body,
          [
            {text: '清除日志', onPress: () => clearCrashLogs()},
            {text: '知道了', style: 'cancel'},
          ],
          {cancelable: true},
        );
      } catch {
        // ignore
      }
    };
    checkCrashLogs();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      {__E2E__ ? <AutomationBridge /> : null}
      <SafeAreaProvider style={styles.transparent}>
        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
          <PaperProvider theme={theme}>
            <L10nContext.Provider value={currentL10n}>
              <WelcomeDialog />
              <NavigationContainer>
                <DeepLinkHandler />
                <BottomSheetModalProvider>
                  <Drawer.Navigator
                    screenOptions={{
                      headerLeft: () => <HeaderLeft />,
                      drawerStyle: {
                        width: screenWidth > 400 ? 320 : screenWidth * 0.8,
                      },
                      headerStyle: {
                        backgroundColor: theme.colors.background,
                      },
                      headerTintColor: theme.colors.onBackground,
                      headerTitleStyle: styles.headerTitle,
                      // @ts-ignore sceneStyle exists at runtime in drawer v7
                      sceneStyle: styles.transparent,
                    }}
                    drawerContent={props => <SidebarContent {...props} />}>
                    <Drawer.Screen
                      name={ROUTES.CHAT}
                      component={gestureHandlerRootHOC(ChatScreen)}
                      // @ts-ignore sceneStyle exists at runtime
                      options={{
                        headerShown: false,
                        sceneStyle: styles.transparent,
                      }}
                    />
                    <Drawer.Screen
                      name={ROUTES.MODELS}
                      component={gestureHandlerRootHOC(ModelsScreen)}
                      // @ts-ignore sceneStyle exists at runtime
                      options={{
                        headerRight: () => <ModelsHeaderRight />,
                        headerStyle: styles.headerWithoutDivider,
                        title: currentL10n.screenTitles.models,
                        sceneStyle: styles.transparent,
                      }}
                    />
                    <Drawer.Screen
                      name={ROUTES.SETTINGS}
                      component={gestureHandlerRootHOC(SettingsScreen)}
                      // @ts-ignore sceneStyle exists at runtime
                      options={{
                        headerStyle: styles.headerWithoutDivider,
                        title: currentL10n.screenTitles.settings,
                        sceneStyle: styles.transparent,
                      }}
                    />
                    <Drawer.Screen
                      name={ROUTES.APP_INFO}
                      component={gestureHandlerRootHOC(AboutScreen)}
                      // @ts-ignore sceneStyle exists at runtime
                      options={{
                        headerStyle: styles.headerWithoutDivider,
                        title: currentL10n.screenTitles.appInfo,
                        sceneStyle: styles.transparent,
                      }}
                    />

                    {/* Only show Dev Tools screen in debug mode */}
                    {isDebugMode && (
                      <Drawer.Screen
                        name={ROUTES.DEV_TOOLS}
                        component={gestureHandlerRootHOC(DevToolsScreen)}
                        // @ts-ignore sceneStyle exists at runtime
                        options={{
                          headerStyle: styles.headerWithoutDivider,
                          title: 'Dev Tools',
                          sceneStyle: styles.transparent,
                        }}
                      />
                    )}
                  </Drawer.Navigator>
                  <TTSSetupSheet />
                </BottomSheetModalProvider>
              </NavigationContainer>
            </L10nContext.Provider>
          </PaperProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    transparent: {
      backgroundColor: 'transparent',
    },
    headerWithoutDivider: {
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 0,
      backgroundColor: theme.colors.background,
    },
    headerWithDivider: {
      backgroundColor: theme.colors.background,
    },
    headerTitle: {
      ...theme.fonts.titleSmall,
    },
  });

// Wrap the App component with AppWithMigration to show migration UI when needed
const AppWithMigrationWrapper = () => {
  return (
    <AppWithMigration>
      <App />
    </AppWithMigration>
  );
};

export default AppWithMigrationWrapper;
