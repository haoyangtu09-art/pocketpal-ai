import * as React from 'react';
import {Dimensions, Image, StyleSheet, View} from 'react-native';

import {observer} from 'mobx-react';
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
} from './src/components';
import {AutomationBridge, BenchmarkRunnerScreen} from './src/__automation__';
import {
  ChatScreen,
  ModelsScreen,
  SettingsScreen,
  BenchmarkScreen,
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

  return (
    <GestureHandlerRootView style={styles.root}>
      {__E2E__ ? <AutomationBridge /> : null}
      <SafeAreaProvider style={styles.transparent}>
        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
          <PaperProvider theme={theme}>
            <L10nContext.Provider value={currentL10n}>
              <NavigationContainer>
                <DeepLinkHandler />
                {/* Background image sits inside NavigationContainer so it
                    renders beneath all screens but above SafeAreaProvider's
                    default opaque background */}
                <View
                  pointerEvents="none"
                  style={styles.backgroundImageWrapper}>
                  <Image
                    source={require('./src/assets/background.png')}
                    style={styles.backgroundImage}
                    resizeMode="contain"
                  />
                </View>
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
                      // @ts-ignore sceneStyle / sceneContainerStyle exist at runtime
                      sceneContainerStyle: styles.transparent,
                      sceneStyle: styles.transparent,
                    }}
                    drawerContent={props => <SidebarContent {...props} />}>
                    <Drawer.Screen
                      name={ROUTES.CHAT}
                      component={gestureHandlerRootHOC(ChatScreen)}
                      // @ts-ignore contentStyle exists at runtime
                      options={{
                        headerShown: false,
                        contentStyle: styles.transparent,
                      }}
                    />
                    <Drawer.Screen
                      name={ROUTES.MODELS}
                      component={gestureHandlerRootHOC(ModelsScreen)}
                      // @ts-ignore contentStyle exists at runtime
                      options={{
                        headerRight: () => <ModelsHeaderRight />,
                        headerStyle: styles.headerWithoutDivider,
                        title: currentL10n.screenTitles.models,
                        contentStyle: styles.transparent,
                      }}
                    />
                    <Drawer.Screen
                      name={ROUTES.BENCHMARK}
                      component={gestureHandlerRootHOC(BenchmarkScreen)}
                      // @ts-ignore contentStyle exists at runtime
                      options={{
                        headerStyle: styles.headerWithoutDivider,
                        title: currentL10n.screenTitles.benchmark,
                        contentStyle: styles.transparent,
                      }}
                    />
                    <Drawer.Screen
                      name={ROUTES.SETTINGS}
                      component={gestureHandlerRootHOC(SettingsScreen)}
                      // @ts-ignore contentStyle exists at runtime
                      options={{
                        headerStyle: styles.headerWithoutDivider,
                        title: currentL10n.screenTitles.settings,
                        contentStyle: styles.transparent,
                      }}
                    />
                    <Drawer.Screen
                      name={ROUTES.APP_INFO}
                      component={gestureHandlerRootHOC(AboutScreen)}
                      // @ts-ignore contentStyle exists at runtime
                      options={{
                        headerStyle: styles.headerWithoutDivider,
                        title: currentL10n.screenTitles.appInfo,
                        contentStyle: styles.transparent,
                      }}
                    />

                    {/* Only show Dev Tools screen in debug mode */}
                    {isDebugMode && (
                      <Drawer.Screen
                        name={ROUTES.DEV_TOOLS}
                        component={gestureHandlerRootHOC(DevToolsScreen)}
                        // @ts-ignore contentStyle exists at runtime
                        options={{
                          headerStyle: styles.headerWithoutDivider,
                          title: 'Dev Tools',
                          contentStyle: styles.transparent,
                        }}
                      />
                    )}

                    {/*
                      E2E-only deep-link-driven benchmark matrix runner.
                      Hidden from the drawer sidebar via
                      drawerItemStyle:{display:'none'}; reachable only by
                      the deep link pocketpal://e2e/benchmark in the e2e
                      flavor build (see useDeepLinking cold-launch effect
                      and android/app/src/e2e/AndroidManifest.xml).
                    */}
                    {__E2E__ && (
                      <Drawer.Screen
                        name={ROUTES.BENCHMARK_RUNNER}
                        component={gestureHandlerRootHOC(BenchmarkRunnerScreen)}
                        // @ts-ignore contentStyle exists at runtime
                        options={{
                          headerStyle: styles.headerWithoutDivider,
                          title: 'Benchmark Runner',
                          drawerItemStyle: {display: 'none'},
                          contentStyle: styles.transparent,
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
    backgroundImageWrapper: {
      position: 'absolute',
      right: 0,
      top: '15%',
      height: '70%',
      zIndex: 0,
    },
    backgroundImage: {
      height: '100%',
      aspectRatio: 1,
      opacity: 0.4,
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
