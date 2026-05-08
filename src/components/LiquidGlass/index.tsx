import React, {useMemo} from 'react';
import {StyleSheet, View, type ViewStyle, type StyleProp} from 'react-native';
import {
  Canvas,
  Fill,
  Shader,
  Skia,
  BackdropFilter,
  Blur,
} from '@shopify/react-native-skia';
import {useWindowDimensions} from 'react-native';
import {highlightShader} from './shaders';

interface LiquidGlassProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Blur intensity (sigma). Higher = more frosted. Default 15. */
  blurAmount?: number;
  /** Corner radius for the glass panel. */
  cornerRadius?: number;
  /** Glass tint as rgba string, e.g. "rgba(7,7,11,0.65)" */
  tintColor?: string;
}

const DEFAULT_TINT = 'rgba(7,7,11,0.65)';

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  style,
  blurAmount = 15,
  cornerRadius = 16,
  tintColor = DEFAULT_TINT,
}) => {
  const {width, height} = useWindowDimensions();

  const effect = useMemo(() => Skia.RuntimeEffect.Make(highlightShader), []);

  return (
    <View
      style={[
        styles.container,
        {borderRadius: cornerRadius, overflow: 'hidden'},
        style,
      ]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Blur what's behind the component */}
        <BackdropFilter filter={<Blur blur={blurAmount} />}>
          {/* Semi-transparent tint over the blurred backdrop */}
          <Fill color={tintColor} />
        </BackdropFilter>

        {/* Highlight shader: specular reflection + fresnel edges */}
        {effect ? (
          <Fill>
            <Shader
              source={effect}
              uniforms={{
                iResolution: [width, height],
                cornerRadius,
              }}
            />
          </Fill>
        ) : null}
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
