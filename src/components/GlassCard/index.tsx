import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View, ViewStyle} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useTheme} from '../../hooks';

const CORNER = 24;

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  tintColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  testID,
  tintColor,
}) => {
  const theme = useTheme();
  const isDark = theme.colors.background === '#000000';

  // Animated gradient border: gold ↔ white shimmer
  const borderAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }),
    ).start();
  }, [borderAnim]);

  const adaptiveTint =
    tintColor ?? (isDark ? 'rgba(255,220,120,0.06)' : 'rgba(255,255,255,0.45)');

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: isDark
      ? [
          'rgba(255,220,120,0.35)',
          'rgba(255,255,255,0.55)',
          'rgba(255,220,120,0.35)',
        ]
      : [
          'rgba(255,255,255,0.8)',
          'rgba(200,180,255,0.7)',
          'rgba(255,255,255,0.8)',
        ],
  });

  const glowColor = isDark ? 'rgba(255,210,100,0.18)' : 'rgba(255,255,255,0.5)';
  const fallbackBg = isDark ? 'rgba(25,25,35,0.88)' : 'rgba(255,255,255,0.78)';

  return (
    <View style={[styles.outerShadow, style]} testID={testID}>
      {/* Edge glow ring */}
      <View style={[styles.glowRing, {shadowColor: glowColor}]} />

      {/* Squircle blur container */}
      <View style={styles.wrapper}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'xlight'}
          blurAmount={20}
          reducedTransparencyFallbackColor={fallbackBg}
        />

        {/* Adaptive tint */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {backgroundColor: adaptiveTint, borderRadius: CORNER},
          ]}
        />

        {/* Top glare highlight */}
        <View style={styles.glare} />

        {/* Animated gradient border */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {borderRadius: CORNER, borderWidth: 1, borderColor},
          ]}
        />

        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerShadow: {
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CORNER + 2,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 0,
  },
  wrapper: {
    borderRadius: CORNER,
    overflow: 'hidden',
  },
  glare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    borderTopLeftRadius: CORNER,
    borderTopRightRadius: CORNER,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    borderRadius: CORNER,
  },
});
