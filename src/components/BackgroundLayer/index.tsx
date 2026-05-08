import React from 'react';
import {Image, StyleSheet} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import {observer} from 'mobx-react';
import {backgroundStore, type BackgroundImage} from '../../store';

interface Props {
  image: BackgroundImage;
  isEditing: boolean;
  globalOpacity: number;
}

/**
 * A single background image layer.
 *
 * In edit mode, supports pan, pinch, and rotation via gesture handler.
 * Transform changes are persisted to BackgroundStore only on gesture end,
 * using runOnJS to safely cross from the UI thread into MobX.
 */
export const BackgroundLayer = observer(
  ({image, isEditing, globalOpacity}: Props) => {
    const scale = useSharedValue(image.scale);
    const rotation = useSharedValue(image.rotation);
    const translateX = useSharedValue(image.x);
    const translateY = useSharedValue(image.y);
    const savedScale = useSharedValue(image.scale);
    const savedRotation = useSharedValue(image.rotation);
    const savedTranslateX = useSharedValue(image.x);
    const savedTranslateY = useSharedValue(image.y);

    // Persist current transform to store (called via runOnJS from UI thread)
    const persistTransform = (
      x: number,
      y: number,
      s: number,
      r: number,
      id: string,
    ) => {
      try {
        backgroundStore.updateImageTransform(id, {x, y, scale: s, rotation: r});
      } catch {
        // Swallow — visual state already committed
      }
    };

    // When editing, compose pan + pinch + rotation
    // When NOT editing, use a no-op gesture to avoid any input processing
    const composed = isEditing
      ? Gesture.Simultaneous(
          Gesture.Pan()
            .onUpdate(e => {
              translateX.value = savedTranslateX.value + e.translationX;
              translateY.value = savedTranslateY.value + e.translationY;
            })
            .onEnd(() => {
              savedTranslateX.value = translateX.value;
              savedTranslateY.value = translateY.value;
              runOnJS(persistTransform)(
                translateX.value,
                translateY.value,
                scale.value,
                rotation.value,
                image.id,
              );
            }),
          Gesture.Pinch()
            .onUpdate(e => {
              scale.value = Math.max(
                0.1,
                Math.min(5, savedScale.value * e.scale),
              );
            })
            .onEnd(() => {
              savedScale.value = scale.value;
              runOnJS(persistTransform)(
                translateX.value,
                translateY.value,
                scale.value,
                rotation.value,
                image.id,
              );
            }),
          Gesture.Rotation()
            .onUpdate(e => {
              rotation.value = savedRotation.value + e.rotation;
            })
            .onEnd(() => {
              savedRotation.value = rotation.value;
              runOnJS(persistTransform)(
                translateX.value,
                translateY.value,
                scale.value,
                rotation.value,
                image.id,
              );
            }),
        )
      : Gesture.Manual(); // No-op gesture — never activates

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
        {scale: scale.value},
        {rotate: `${rotation.value}rad`},
      ],
      opacity: image.opacity * globalOpacity,
    }));

    // Wrap Image in try/catch boundary — some content:// URIs may fail
    const imageSource = React.useMemo(() => {
      try {
        return {uri: image.uri};
      } catch {
        return undefined;
      }
    }, [image.uri]);

    if (!imageSource) {
      return null;
    }

    return (
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            styles.layer,
            animatedStyle,
            isEditing && styles.editingBorder,
          ]}>
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
            onError={() => {
              // Silently ignore broken images — don't crash
            }}
          />
        </Animated.View>
      </GestureDetector>
    );
  },
);

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
  editingBorder: {
    borderWidth: 2,
    borderColor: 'rgba(100, 150, 255, 0.6)',
    borderStyle: 'dashed',
    borderRadius: 4,
    padding: 4,
  },
});
