import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '../../hooks';
import {uiStore} from '../../store';
import {LiquidGlass} from '../LiquidGlass';

const CORNER = 20;

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  tintColor?: string;
  blurAmount?: number;
}

/**
 * Glass card component.
 *
 * When the user has "动态视效" enabled in settings, renders a Skia-based
 * matte glass surface. Otherwise falls back to the CSS shimmer-card style
 * for low-end devices.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  testID,
  tintColor,
  blurAmount = 12,
}) => {
  const theme = useTheme();
  const useLiquid = uiStore.useLiquidGlass;

  if (useLiquid) {
    const glassTint =
      tintColor ??
      (theme.dark ? 'rgba(7,7,11,0.65)' : 'rgba(240,240,248,0.50)');
    return (
      <LiquidGlass
        style={[styles.liquidShadow, style]}
        cornerRadius={CORNER}
        blurAmount={blurAmount}
        tintColor={glassTint}>
        <View style={styles.content}>{children}</View>
      </LiquidGlass>
    );
  }

  // ---- Fallback: CSS shimmer card ----
  return (
    <ShimmerGlassCard {...{children, style, testID, isDark: theme.dark}} />
  );
};

// ---- Original shimmer-based glass card (fallback) ----

const ShimmerGlassCard: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  isDark: boolean;
}> = ({children, style, testID, isDark}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [shimmerAnim]);

  const borderColor = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: isDark
      ? [
          'rgba(180,180,200,0.25)',
          'rgba(255,255,255,0.55)',
          'rgba(180,180,200,0.25)',
        ]
      : [
          'rgba(200,200,220,0.4)',
          'rgba(255,255,255,0.9)',
          'rgba(200,200,220,0.4)',
        ],
  });

  const topEdgeOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.9, 0.3],
  });

  const bg = isDark ? 'rgba(18,18,28,0.82)' : 'rgba(240,240,255,0.82)';

  return (
    <View style={[shimmerStyles.shadow, style]} testID={testID}>
      <Animated.View style={[shimmerStyles.borderRing, {borderColor}]} />
      <View style={[shimmerStyles.body, {backgroundColor: bg}]}>
        <Animated.View
          style={[shimmerStyles.topEdge, {opacity: topEdgeOpacity}]}
        />
        <View style={shimmerStyles.content}>{children}</View>
      </View>
    </View>
  );
};

const shimmerStyles = StyleSheet.create({
  shadow: {
    borderRadius: CORNER,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CORNER,
    borderWidth: 1,
  },
  body: {
    borderRadius: CORNER,
    overflow: 'hidden',
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 1.5,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  content: {
    borderRadius: CORNER,
  },
});

const styles = StyleSheet.create({
  liquidShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    borderRadius: CORNER,
  },
});
