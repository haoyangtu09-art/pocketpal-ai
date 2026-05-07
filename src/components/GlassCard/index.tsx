import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '../../hooks';

const CORNER = 20;

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
}) => {
  const theme = useTheme();
  const isDark = theme.dark;

  // Shimmer animation along top edge
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
    <View style={[styles.shadow, style]} testID={testID}>
      {/* Outer border with shimmer */}
      <Animated.View style={[styles.borderRing, {borderColor}]} />
      {/* Card body */}
      <View style={[styles.body, {backgroundColor: bg}]}>
        {/* Top edge highlight — the "reflection" */}
        <Animated.View style={[styles.topEdge, {opacity: topEdgeOpacity}]} />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
