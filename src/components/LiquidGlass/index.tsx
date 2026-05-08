import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import {
  Canvas,
  Fill,
  Shader,
  Skia,
  BackdropFilter,
  Blur,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import {highlightShader} from './shaders';

// Module-level singleton — compiled once, shared across all instances
const sharedEffect = Skia.RuntimeEffect.Make(highlightShader);

interface LiquidGlassProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  blurAmount?: number;
  cornerRadius?: number;
  /** Glass tint as rgba string, e.g. "rgba(7,7,11,0.65)" */
  tintColor?: string;
}

const DEFAULT_TINT = 'rgba(7,7,11,0.65)';

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  style,
  blurAmount = 12,
  cornerRadius = 16,
  tintColor = DEFAULT_TINT,
}) => {
  const [size, setSize] = useState({width: 0, height: 0});
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Stable onLayout — never recreated (empty deps, ref for size tracking)
  const sizeRef = useRef(size);
  const onLayout = useCallback(
    (e: {nativeEvent: {layout: {width: number; height: number}}}) => {
      const {width, height} = e.nativeEvent.layout;
      if (
        width > 0 &&
        height > 0 &&
        (width !== sizeRef.current.width || height !== sizeRef.current.height)
      ) {
        sizeRef.current = {width, height};
        setSize({width, height});
      }
    },
    [],
  );

  const ready = size.width > 0 && size.height > 0;
  const safeCornerRadius = Math.max(cornerRadius, 1);

  // Fade in glass overlay on first layout
  useEffect(() => {
    if (ready) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [ready, fadeAnim]);

  // Parse tint into center (darker) and edge (lighter) for radial gradient
  // that reinforces the bubble illusion
  const tintCenter = tintColor.replace(/[\d.]+\)$/, m => {
    const a = parseFloat(m);
    return `${Math.min(a + 0.08, 1).toFixed(2)})`;
  });
  const tintEdge = tintColor;

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        {borderRadius: cornerRadius, overflow: 'hidden'},
        style,
      ]}>
      {ready && sharedEffect && (
        <Animated.View style={[StyleSheet.absoluteFill, {opacity: fadeAnim}]}>
          <Canvas style={StyleSheet.absoluteFill}>
            <BackdropFilter filter={<Blur blur={blurAmount} />}>
              <Fill>
                <RadialGradient
                  c={vec(size.width / 2, size.height / 2)}
                  r={Math.max(size.width, size.height) / 1.5}
                  colors={[tintCenter, tintEdge]}
                />
              </Fill>
            </BackdropFilter>
            <Fill>
              <Shader
                source={sharedEffect}
                uniforms={{
                  iResolution: [size.width, size.height],
                  cornerRadius: safeCornerRadius,
                  iLightOrigin: [0.3, 0.2],
                }}
              />
            </Fill>
          </Canvas>
        </Animated.View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
