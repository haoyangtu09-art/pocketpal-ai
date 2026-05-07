import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useTheme} from '../../hooks';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({children, style, testID}) => {
  const theme = useTheme();
  const isDark = theme.colors.background === '#000000';

  return (
    <View style={[styles.wrapper, style]} testID={testID}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={16}
        reducedTransparencyFallbackColor={
          isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.75)'
        }
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(255,255,255,0.45)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(255,255,255,0.7)',
          },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  content: {
    borderRadius: 16,
  },
});
