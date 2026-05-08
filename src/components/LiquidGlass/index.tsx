import React, {useMemo, useState, useCallback} from 'react';
import {StyleSheet, View, type ViewStyle, type StyleProp} from 'react-native';
import {
  Canvas,
  Fill,
  Shader,
  Skia,
  BackdropFilter,
  Blur,
} from '@shopify/react-native-skia';
import {highlightShader} from './shaders';

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

  const onLayout = useCallback(
    (e: {nativeEvent: {layout: {width: number; height: number}}}) => {
      const {width, height} = e.nativeEvent.layout;
      if (
        width > 0 &&
        height > 0 &&
        (width !== size.width || height !== size.height)
      ) {
        setSize({width, height});
      }
    },
    [size.width, size.height],
  );

  const effect = useMemo(() => Skia.RuntimeEffect.Make(highlightShader), []);

  const ready = size.width > 0 && size.height > 0;

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        {borderRadius: cornerRadius, overflow: 'hidden'},
        style,
      ]}>
      {ready && (
        <Canvas style={StyleSheet.absoluteFill}>
          <BackdropFilter filter={<Blur blur={blurAmount} />}>
            <Fill color={tintColor} />
          </BackdropFilter>
          {effect ? (
            <Fill>
              <Shader
                source={effect}
                uniforms={{
                  iResolution: [size.width, size.height],
                  cornerRadius,
                }}
              />
            </Fill>
          ) : null}
        </Canvas>
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
