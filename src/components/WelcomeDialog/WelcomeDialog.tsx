import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {Dialog} from '../Dialog/Dialog';
import {useTheme} from '../../hooks';

const WELCOME_SHOWN_KEY = '@lumo/welcome_shown';

const styles = StyleSheet.create({
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 6,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingRight: 16,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
    opacity: 0.85,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.55,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
});

export const WelcomeDialog: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    try {
      AsyncStorage.getItem(WELCOME_SHOWN_KEY).then(value => {
        if (!value) {
          setVisible(true);
        }
      });
    } catch {
      // AsyncStorage unavailable (e.g. test environment) — skip dialog
    }
  }, []);

  const handleDismiss = async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    } catch {
      // Silently ignore — dialog is already dismissed
    }
  };

  const textColor = theme.colors.onSurface;

  return (
    <Dialog
      visible={visible}
      onDismiss={handleDismiss}
      title="欢迎来到 Lumo ✨"
      scrollable
      avoidKeyboard
      dismissable={false}
      actions={[
        {
          label: '我明白啦～',
          onPress: handleDismiss,
          mode: 'contained',
          testID: 'welcome-dialog-dismiss',
        },
      ]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: textColor}]}>
          隐私与数据
        </Text>
        <View style={styles.bullet}>
          <Text style={[styles.bulletText, {color: textColor}]}>
            {'\u2022'} 所有对话数据仅保存在你的设备上，Lumo 不会偷看的！
          </Text>
        </View>
        <View style={styles.bullet}>
          <Text style={[styles.bulletText, {color: textColor}]}>
            {'\u2022'} 你填写的 API 密钥和任何个人信息都不会上传到任何服务器
          </Text>
        </View>
        <View style={styles.bullet}>
          <Text style={[styles.bulletText, {color: textColor}]}>
            {'\u2022'} 本应用完全离线运行，不需要联网也能陪着你～
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: textColor}]}>免责声明</Text>
        <View style={styles.bullet}>
          <Text style={[styles.bulletText, {color: textColor}]}>
            {'\u2022'} Lumo 是 AI，不是真正的人类，说的话可能会有错误哦
          </Text>
        </View>
        <View style={styles.bullet}>
          <Text style={[styles.bulletText, {color: textColor}]}>
            {'\u2022'} Lumo 的回复不能替代医疗、法律、心理健康等专业建议
          </Text>
        </View>
        <View style={styles.bullet}>
          <Text style={[styles.bulletText, {color: textColor}]}>
            {'\u2022'} 如果你正在经历困难，请一定要寻求专业人士的帮助
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: textColor}]}>开源声明</Text>
        <View style={styles.bullet}>
          <Text style={[styles.bulletText, {color: textColor}]}>
            {'\u2022'} 本应用基于开源项目 PocketPal AI 修改，遵循原项目开源协议
          </Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        继续使用即表示你同意以上内容～ Lumo 会一直在这里陪着你 🌙
      </Text>
    </Dialog>
  );
};
