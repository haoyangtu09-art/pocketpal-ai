import React, {useState, useEffect, useRef, useContext} from 'react';
import {
  View,
  Platform,
  Keyboard,
  ScrollView,
  TextInput as RNTextInput,
  Alert,
  Linking,
  TouchableOpacity,
  Image,
} from 'react-native';

import {debounce} from 'lodash';
import {observer} from 'mobx-react-lite';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Switch, Text, Button, Icon, SegmentedButtons} from 'react-native-paper';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';

import {GlobeIcon, MoonIcon, LinkExternalIcon} from '../../assets/icons';

import {
  TextInput,
  Menu,
  Divider,
  HFTokenSheet,
  InputSlider,
  GlassCard,
} from '../../components';

import {useTheme} from '../../hooks';

import {createStyles} from './styles';

import {
  modelStore,
  uiStore,
  hfStore,
  serverStore,
  backgroundStore,
} from '../../store';
import {languageDisplayNames} from '../../locales';

import {L10nContext} from '../../utils';
import {t} from '../../locales';
import {checkGpuSupport} from '../../utils/deviceCapabilities';
import {getDeviceOptions, DeviceOption} from '../../utils/deviceSelection';

// OpenCL documentation URL (not localized)
const OPENCL_DOCS_URL =
  'https://github.com/ggml-org/llama.cpp/blob/master/docs/backend/OPENCL.md#model-preparation';

export const SettingsScreen: React.FC = observer(() => {
  const l10n = useContext(L10nContext);
  const theme = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<any>();
  const [contextSize, setContextSize] = useState(
    modelStore.contextInitParams.n_ctx.toString(),
  );
  const [isValidInput, setIsValidInput] = useState(true);
  const inputRef = useRef<RNTextInput>(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showHfTokenDialog, setShowHfTokenDialog] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApplyingServer, setIsApplyingServer] = useState(false);
  const [gpuSupported, setGpuSupported] = useState(false);
  const [languageAnchor, setLanguageAnchor] = useState<{x: number; y: number}>({
    x: 0.0,
    y: 0.0,
  });
  const [deviceOptions, setDeviceOptions] = useState<DeviceOption[]>([]);
  const languageButtonRef = useRef<View>(null);
  const debouncedUpdateStore = useRef(
    debounce((value: number) => {
      modelStore.setNContext(value);
    }, 500),
  ).current;

  useEffect(() => {
    setContextSize(modelStore.contextInitParams.n_ctx.toString());

    // Check for GPU support (Metal on iOS 18+, OpenCL on Android with Adreno + CPU features)
    const checkGpuCapabilities = async () => {
      const gpuCapabilities = await checkGpuSupport();
      setGpuSupported(gpuCapabilities.isSupported);
    };

    checkGpuCapabilities().catch(error => {
      console.warn('Failed to check GPU capabilities:', error);
      setGpuSupported(false);
    });

    // Load available device options
    const loadDeviceOptions = async () => {
      try {
        const options = await getDeviceOptions();
        setDeviceOptions(options);
      } catch (error) {
        console.warn('Failed to load device options:', error);
      }
    };

    loadDeviceOptions();
  }, []);

  useEffect(() => {
    return () => {
      debouncedUpdateStore.cancel();
    };
  }, [debouncedUpdateStore]);

  useEffect(() => {
    const loadServerConfig = async () => {
      const firstServer = serverStore.servers[0];
      if (firstServer) {
        setApiUrl(firstServer.url);
        const key = await serverStore.getApiKey(firstServer.id);
        if (key) {
          setApiKeyInput(key);
        }
      }
    };
    loadServerConfig();
  }, []);

  const handleOutsidePress = () => {
    Keyboard.dismiss();
    inputRef.current?.blur();
    setContextSize(modelStore.contextInitParams.n_ctx.toString());
    setIsValidInput(true);
    setShowLanguageMenu(false);
  };

  const handleContextSizeChange = (text: string) => {
    setContextSize(text);
    const value = parseInt(text, 10);
    if (!isNaN(value) && value >= modelStore.MIN_CONTEXT_SIZE) {
      setIsValidInput(true);
      debouncedUpdateStore(value);
    } else {
      setIsValidInput(false);
    }
  };

  const getCurrentDeviceId = (): string => {
    const devices = modelStore.contextInitParams.devices;
    const nGpuLayers = modelStore.contextInitParams.n_gpu_layers ?? 0;

    // iOS
    if (Platform.OS === 'ios') {
      if (!devices || devices.length === 0) {
        return nGpuLayers === 0 ? 'cpu' : 'auto';
      }
      if (devices[0] === 'Metal') {
        return 'gpu';
      }
      if (devices[0] === 'CPU') {
        return 'cpu';
      }
      return 'auto';
    }

    // Android
    // No auto mode on Android - always explicit device selection
    if (!devices || devices.length === 0 || devices[0] === 'CPU') {
      return 'cpu';
    }

    if (devices[0].startsWith('HTP')) {
      return 'hexagon';
    }

    // GPU device (Adreno, etc.)
    return 'gpu';
  };

  const handleDeviceSelect = (option: DeviceOption) => {
    modelStore.setDevices(option.devices);

    // Only update flash attention if current value is not valid for the selected device
    const currentFlashAttn =
      modelStore.contextInitParams.flash_attn_type ??
      (Platform.OS === 'ios' ? 'auto' : 'off');

    if (!option.valid_flash_attn_types.includes(currentFlashAttn)) {
      // Current setting is invalid for this device, use the default
      modelStore.setFlashAttnType(option.default_flash_attn_type);
    }
    // Otherwise, keep the user's current flash attention preference
  };

  const handleLanguagePress = () => {
    languageButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setLanguageAnchor({x: pageX, y: pageY + height});
      setShowLanguageMenu(true);
    });
  };

  const handleApplyServer = async () => {
    setIsApplyingServer(true);
    try {
      let serverId: string;
      if (serverStore.servers.length > 0) {
        serverId = serverStore.servers[0].id;
        serverStore.updateServer(serverId, {url: apiUrl});
      } else {
        serverId = serverStore.addServer({
          name: 'Remote Server',
          url: apiUrl,
        });
      }
      await serverStore.setApiKey(serverId, apiKeyInput);
      await serverStore.fetchModelsForServer(serverId);

      const models = serverStore.serverModels.get(serverId) || [];
      if (models.length > 0) {
        // Auto-add the first model so it appears in the chat model selector immediately
        serverStore.addUserSelectedModel(serverId, models[0].id);
        Alert.alert(
          '✓ 已连接',
          `找到 ${models.length} 个模型，已将「${models[0].id}」加入可用列表。\n\n在聊天界面右上角菜单可切换模型。`,
        );
      } else {
        Alert.alert('✓ 已连接', '该服务器没有返回任何模型');
      }
    } catch (e: any) {
      Alert.alert('✗ 连接失败', e.message || '未知错误');
    } finally {
      setIsApplyingServer(false);
    }
  };

  const handleTestConnection = async () => {
    // Ensure server is saved before testing
    let serverId: string;
    if (serverStore.servers.length > 0) {
      serverId = serverStore.servers[0].id;
      serverStore.updateServer(serverId, {url: apiUrl});
    } else {
      serverId = serverStore.addServer({
        name: 'Remote Server',
        url: apiUrl,
      });
    }
    await serverStore.setApiKey(serverId, apiKeyInput);

    const result = await serverStore.testServerConnection(serverId);
    if (result.ok) {
      Alert.alert('连接测试', `✓ 连接成功，找到 ${result.modelCount} 个模型`);
    } else {
      Alert.alert('连接测试', `✗ 连接失败: ${result.error ?? '未知错误'}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={handleOutsidePress}>
        {/* Card 1 — 模型参数 */}
        <GlassCard style={styles.card}>
          <Text
            variant="titleMedium"
            style={[styles.cardTitle, styles.textLabel]}>
            {l10n.settings.modelInitializationSettings}
          </Text>
          <View style={styles.cardContent}>
            {/* Device Selection */}
            <View style={styles.settingItemContainer}>
              {deviceOptions.length > 1 ? (
                <>
                  <Text variant="titleMedium" style={styles.textLabel}>
                    {Platform.OS === 'ios'
                      ? l10n.settings.deviceSelectionIOS
                      : l10n.settings.deviceSelection}
                  </Text>
                  <Text variant="labelSmall" style={styles.textDescription}>
                    {Platform.OS === 'ios'
                      ? l10n.settings.deviceSelectionIOSDescription
                      : l10n.settings.deviceSelectionAndroidDescription}
                  </Text>
                  <SegmentedButtons
                    value={getCurrentDeviceId()}
                    onValueChange={deviceId => {
                      const option = deviceOptions.find(
                        opt => opt.id === deviceId,
                      );
                      if (option) {
                        handleDeviceSelect(option);
                      }
                    }}
                    density="medium"
                    buttons={deviceOptions.map(option => ({
                      value: option.id,
                      label: option.label,
                      labelStyle: {
                        fontSize: 10,
                      },
                      testID: `device-option-${option.id}`,
                    }))}
                    style={styles.segmentedButtons}
                  />

                  {/* GPU Layers Slider */}
                  <InputSlider
                    testID="gpu-layers-slider"
                    value={modelStore.contextInitParams.n_gpu_layers}
                    onValueChange={value =>
                      modelStore.setNGPULayers(Math.round(value))
                    }
                    min={0}
                    max={99}
                    step={1}
                  />
                  <Text variant="labelSmall" style={styles.textDescription}>
                    {t(l10n.settings.layersOnGPU, {
                      gpuLayers:
                        modelStore.contextInitParams.n_gpu_layers.toString(),
                    })}
                  </Text>
                </>
              ) : (
                /* Simplified UI when only CPU available */
                <>
                  <Text variant="titleMedium" style={styles.textLabel}>
                    {l10n.settings.deviceSelection}
                  </Text>
                  <Text variant="labelSmall" style={styles.textDescription}>
                    {l10n.settings.cpuOnlyNoAccelerators}
                  </Text>
                </>
              )}

              {/* OpenCL quantization note for Android */}
              {Platform.OS === 'android' &&
                gpuSupported &&
                (modelStore.contextInitParams.n_gpu_layers ?? 0) > 0 && (
                  <View>
                    <Text variant="labelSmall" style={styles.textDescription}>
                      {l10n.settings.openCLQuantizationNote}
                    </Text>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(OPENCL_DOCS_URL)}
                      style={styles.linkContainer}>
                      <Text
                        variant="labelSmall"
                        style={[
                          styles.textDescription,
                          {color: theme.colors.primary},
                        ]}>
                        {l10n.settings.openCLDocsLink}
                      </Text>
                      <LinkExternalIcon
                        width={12}
                        height={12}
                        stroke={theme.colors.primary}
                        style={styles.linkIcon}
                      />
                    </TouchableOpacity>
                  </View>
                )}
            </View>
            <Divider />

            {/* Context Size */}
            <View style={styles.settingItemContainer}>
              <Text variant="titleMedium" style={styles.textLabel}>
                {l10n.settings.contextSize}
              </Text>
              <TextInput
                ref={inputRef}
                testID="context-size-input"
                style={[styles.textInput, !isValidInput && styles.invalidInput]}
                keyboardType="numeric"
                value={contextSize}
                onChangeText={handleContextSizeChange}
                placeholder={t(l10n.settings.contextSizePlaceholder, {
                  minContextSize: modelStore.MIN_CONTEXT_SIZE.toString(),
                })}
              />
              {!isValidInput && (
                <Text style={styles.errorText}>
                  {t(l10n.settings.invalidContextSizeError, {
                    minContextSize: modelStore.MIN_CONTEXT_SIZE.toString(),
                  })}
                </Text>
              )}
              <Text variant="labelSmall" style={styles.textDescription}>
                {l10n.settings.modelReloadNotice}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Card 2 — 应用设置 */}
        <GlassCard style={styles.card}>
          <Text
            variant="titleMedium"
            style={[styles.cardTitle, styles.textLabel]}>
            {l10n.settings.appSettings}
          </Text>
          <View style={styles.cardContent}>
            <View style={styles.settingItemContainer}>
              {/* Language Selection */}
              <View style={styles.switchContainer}>
                <View style={styles.textContainer}>
                  <View style={styles.labelWithIconContainer}>
                    <GlobeIcon
                      width={20}
                      height={20}
                      style={styles.settingIcon}
                      stroke={theme.colors.onSurface}
                    />
                    <Text variant="titleMedium" style={styles.textLabel}>
                      {l10n.settings.language}
                    </Text>
                  </View>
                </View>
                <View style={styles.menuContainer}>
                  <Button
                    ref={languageButtonRef}
                    testID="language-selector-button"
                    mode="outlined"
                    onPress={handleLanguagePress}
                    style={styles.menuButton}
                    contentStyle={styles.buttonContent}
                    icon={({size, color}) => (
                      <Icon source="chevron-down" size={size} color={color} />
                    )}>
                    {languageDisplayNames[uiStore.language]}
                  </Button>
                  <Menu
                    visible={showLanguageMenu}
                    onDismiss={() => setShowLanguageMenu(false)}
                    anchor={languageAnchor}
                    selectable>
                    {uiStore.supportedLanguages.map(lang => (
                      <Menu.Item
                        key={lang}
                        testID={`language-option-${lang}`}
                        style={styles.menu}
                        label={languageDisplayNames[lang]}
                        selected={lang === uiStore.language}
                        onPress={() => {
                          uiStore.setLanguage(lang);
                          setShowLanguageMenu(false);
                        }}
                      />
                    ))}
                  </Menu>
                </View>
              </View>
              <Divider />

              {/* Dark Mode */}
              <View style={styles.switchContainer}>
                <View style={styles.textContainer}>
                  <View style={styles.labelWithIconContainer}>
                    <MoonIcon
                      width={20}
                      height={20}
                      style={styles.settingIcon}
                      stroke={theme.colors.onSurface}
                    />
                    <Text variant="titleMedium" style={styles.textLabel}>
                      {l10n.settings.darkMode}
                    </Text>
                  </View>
                </View>
                <Switch
                  testID="dark-mode-switch"
                  value={uiStore.colorScheme === 'dark'}
                  onValueChange={value =>
                    uiStore.setColorScheme(value ? 'dark' : 'light')
                  }
                />
              </View>

              {/* Liquid Glass Effect Toggle */}
              <Divider />
              <View style={styles.switchContainer}>
                <View style={styles.textContainer}>
                  <View style={styles.labelWithIconContainer}>
                    <Icon
                      source="water"
                      size={20}
                      color={theme.colors.onSurface}
                    />
                    <Text variant="titleMedium" style={styles.textLabel}>
                      动态视效
                    </Text>
                  </View>
                  <Text variant="labelSmall" style={styles.textDescription}>
                    开启 Skia 动态玻璃效果，关闭后使用普通毛玻璃
                  </Text>
                </View>
                <Switch
                  testID="liquid-glass-switch"
                  value={uiStore.useLiquidGlass}
                  onValueChange={value => uiStore.setUseLiquidGlass(value)}
                />
              </View>

              {/* Default System Prompt */}
              <Divider />
              <View style={styles.settingItemContainer}>
                <Text variant="titleMedium" style={styles.textLabel}>
                  {l10n.settings.defaultSystemPrompt}
                </Text>
                <Text variant="labelSmall" style={styles.textDescription}>
                  {l10n.settings.defaultSystemPromptDescription}
                </Text>
                <RNTextInput
                  testID="default-system-prompt-input"
                  style={[
                    styles.textInput,
                    styles.systemPromptInput,
                    styles.textLabel,
                  ]}
                  multiline
                  value={uiStore.defaultSystemPrompt}
                  onChangeText={value => uiStore.setDefaultSystemPrompt(value)}
                  placeholder={l10n.settings.defaultSystemPromptPlaceholder}
                  placeholderTextColor={theme.colors.onSurfaceDisabled}
                />
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Card 3 — API 配置 */}
        <GlassCard style={styles.card}>
          <Text
            variant="titleMedium"
            style={[styles.cardTitle, styles.textLabel]}>
            API 配置
          </Text>
          <View style={styles.cardContent}>
            <View style={styles.settingItemContainer}>
              <Text variant="titleMedium" style={styles.textLabel}>
                API 地址
              </Text>
              <RNTextInput
                style={[styles.textInput, styles.textLabel]}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="http://192.168.1.100:1234"
                placeholderTextColor={theme.colors.onSurfaceDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text
                variant="titleMedium"
                style={[styles.textLabel, styles.marginTop8]}>
                API Key
              </Text>
              <RNTextInput
                style={[styles.textInput, styles.textLabel]}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder="sk-..."
                placeholderTextColor={theme.colors.onSurfaceDisabled}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  loading={isApplyingServer}
                  onPress={handleApplyServer}>
                  应用
                </Button>
                <Button mode="outlined" onPress={handleTestConnection}>
                  测试连接
                </Button>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Card 4 — HuggingFace Token */}
        <GlassCard style={styles.card}>
          <Text
            variant="titleMedium"
            style={[styles.cardTitle, styles.textLabel]}>
            {l10n.settings.apiSettingsTitle}
          </Text>
          <View style={styles.cardContent}>
            <View style={styles.settingItemContainer}>
              {/* Hugging Face Token */}
              <View style={styles.switchContainer}>
                <View style={styles.textContainer}>
                  <Text variant="titleMedium" style={styles.textLabel}>
                    {l10n.settings.huggingFaceTokenLabel}
                  </Text>
                  <Text variant="labelSmall" style={styles.textDescription}>
                    {hfStore.isTokenPresent
                      ? l10n.settings.tokenIsSetDescription
                      : l10n.settings.setTokenDescription}
                  </Text>
                </View>
                <Button
                  mode="outlined"
                  onPress={() => setShowHfTokenDialog(true)}
                  style={styles.menuButton}>
                  {hfStore.isTokenPresent
                    ? l10n.common.update
                    : l10n.settings.setTokenButton}
                </Button>
              </View>

              {/* Use HF Token Switch */}
              <Divider style={styles.divider} />
              <View style={styles.switchContainer}>
                <View style={styles.textContainer}>
                  <Text variant="titleMedium" style={styles.textLabel}>
                    {l10n.settings.useHfTokenLabel}
                  </Text>
                  <Text variant="labelSmall" style={styles.textDescription}>
                    {l10n.settings.useHfTokenDescription}
                  </Text>
                </View>
                <Switch
                  testID="use-hf-token-switch"
                  value={hfStore.useHfToken}
                  disabled={!hfStore.isTokenPresent}
                  onValueChange={value => hfStore.setUseHfToken(value)}
                />
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Card 5 — 背景图管理 */}
        <GlassCard style={styles.card}>
          <View style={styles.cardTitle}>
            <Text variant="titleMedium">背景图管理</Text>
          </View>
          <View style={styles.cardContent}>
            {/* Global opacity slider */}
            <View style={styles.settingItemContainer}>
              <Text variant="titleMedium" style={styles.textLabel}>
                全局透明度
              </Text>
              <Text variant="labelSmall" style={styles.textDescription}>
                {Math.round(backgroundStore.globalOpacity * 100)}%
              </Text>
              <View style={styles.slider}>
                <InputSlider
                  label=""
                  value={backgroundStore.globalOpacity}
                  onValueChange={v => backgroundStore.setGlobalOpacity(v)}
                  min={0.05}
                  max={1}
                  step={0.05}
                  precision={2}
                  testID="bg-global-opacity-slider"
                />
              </View>
            </View>

            <Divider />

            {/* Add images button */}
            <Button
              mode="outlined"
              icon="image-plus"
              onPress={async () => {
                try {
                  const result = await launchImageLibrary({
                    mediaType: 'photo',
                    selectionLimit: 10,
                  });
                  if (result.assets && result.assets.length > 0) {
                    const uris = result.assets
                      .map(a => a.uri)
                      .filter((u): u is string => !!u);
                    if (uris.length > 0) {
                      backgroundStore.addImages(uris);
                      // Navigate to chat in edit mode
                      uiStore.setBackgroundEditMode(true);
                      navigation.navigate('Chat');
                    }
                  }
                } catch {
                  // User cancelled or error — ignore
                }
              }}
              style={styles.marginTop8}>
              添加背景图片
            </Button>

            {/* Edit mode button */}
            {backgroundStore.images.length > 0 && (
              <Button
                mode="outlined"
                icon="pencil"
                style={styles.marginTop8}
                onPress={() => {
                  uiStore.setBackgroundEditMode(true);
                  navigation.navigate('Chat');
                }}>
                编辑背景图布局
              </Button>
            )}

            {/* Show/hide default background */}
            <Divider />
            <View style={styles.switchContainer}>
              <View style={styles.textContainer}>
                <Text variant="titleMedium" style={styles.textLabel}>
                  显示默认背景图
                </Text>
                <Text variant="labelSmall" style={styles.textDescription}>
                  关闭后仅显示导入的背景图
                </Text>
              </View>
              <Switch
                value={uiStore.showDefaultBackground}
                onValueChange={v => uiStore.setShowDefaultBackground(v)}
              />
            </View>

            {/* Image list */}
            {backgroundStore.images.length > 0 && (
              <>
                <Divider />
                {backgroundStore.images.map(img => (
                  <View
                    key={img.id}
                    style={[styles.switchContainer, styles.bgImageRow]}>
                    <Image
                      source={{uri: img.uri}}
                      style={styles.bgThumbnail}
                      resizeMode="cover"
                    />
                    <Text
                      variant="labelSmall"
                      style={styles.bgFileName}
                      numberOfLines={1}>
                      {img.uri.split('/').pop() ?? '未知'}
                    </Text>
                    <Button
                      mode="text"
                      icon="delete"
                      textColor={theme.colors.error}
                      onPress={() =>
                        Alert.alert('删除背景图', '确定要删除这张背景图吗？', [
                          {text: '取消', style: 'cancel'},
                          {
                            text: '删除',
                            style: 'destructive',
                            onPress: () => backgroundStore.removeImage(img.id),
                          },
                        ])
                      }>
                      删除
                    </Button>
                  </View>
                ))}
              </>
            )}

            {/* Clear all */}
            {backgroundStore.images.length > 0 && (
              <>
                <Divider />
                <Button
                  mode="text"
                  textColor={theme.colors.error}
                  onPress={() =>
                    Alert.alert(
                      '清空全部背景图',
                      '确定要删除所有背景图吗？此操作不可撤销。',
                      [
                        {text: '取消', style: 'cancel'},
                        {
                          text: '清空',
                          style: 'destructive',
                          onPress: () => backgroundStore.clearAll(),
                        },
                      ],
                    )
                  }>
                  清空全部背景图
                </Button>
              </>
            )}
          </View>
        </GlassCard>
      </ScrollView>
      <HFTokenSheet
        isVisible={showHfTokenDialog}
        onDismiss={() => setShowHfTokenDialog(false)}
        onSave={() => setShowHfTokenDialog(false)}
      />
    </SafeAreaView>
  );
});
