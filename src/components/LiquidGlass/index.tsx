import React, {useMemo} from 'react';
import {StyleSheet, View, type ViewStyle, type StyleProp} from 'react-native';
import {Canvas, Fill, Shader, Skia} from '@shopify/react-native-skia';
import {useWindowDimensions} from 'react-native';
import {liquidGlassShader} from './shaders';

interface LiquidGlassProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  blurAmount?: number;
  refractionStrength?: number;
  cornerRadius?: number;
  /** Glass tint as [r, g, b, a] normalized 0-1. */
  tintColor?: readonly [number, number, number, number];
}

const DARK_TINT: readonly [number, number, number, number] = [
  0.07, 0.07, 0.11, 0.82,
];

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  style,
  blurAmount = 2.0,
  refractionStrength = 0.15,
  cornerRadius = 16,
  tintColor,
}) => {
  const {width, height} = useWindowDimensions();

  const effect = useMemo(() => Skia.RuntimeEffect.Make(liquidGlassShader), []);

  const color = tintColor ?? DARK_TINT;

  if (!effect) {
    return (
      <View
        style={[
          styles.container,
          {
            borderRadius: cornerRadius,
            backgroundColor: `rgba(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)}, ${color[3]})`,
          },
          style,
        ]}>
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {borderRadius: cornerRadius, overflow: 'hidden'},
        style,
      ]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill>
          <Shader
            source={effect}
            uniforms={{
              iResolution: [width, height],
              glassColor: color,
              cornerRadius,
              refractionStrength,
              blurAmount,
              iTime: 0,
            }}
          />
        </Fill>
      </Canvas>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
