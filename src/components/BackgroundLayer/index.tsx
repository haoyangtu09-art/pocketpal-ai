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

export const BackgroundLayer = observer(
  ({image, isEditing, globalOpacity}: Props) => {
    const translateX = useSharedValue(image.x);
    const translateY = useSharedValue(image.y);
    const scale = useSharedValue(image.scale);
    const savedTx = useSharedValue(image.x);
    const savedTy = useSharedValue(image.y);
    const savedScale = useSharedValue(image.scale);

    const persist = (x: number, y: number, s: number, id: string) => {
      try {
        backgroundStore.updateImageTransform(id, {x, y, scale: s});
      } catch {
        // ignore
      }
    };

    // Pan gesture for position — works with 1 finger
    const pan = Gesture.Pan()
      .enabled(isEditing)
      .onUpdate(e => {
        translateX.value = savedTx.value + e.translationX;
        translateY.value = savedTy.value + e.translationY;
      })
      .onEnd(() => {
        savedTx.value = translateX.value;
        savedTy.value = translateY.value;
        runOnJS(persist)(
          translateX.value,
          translateY.value,
          scale.value,
          image.id,
        );
      });

    // Pinch gesture for scale — works with 2 fingers
    const pinch = Gesture.Pinch()
      .enabled(isEditing)
      .onUpdate(e => {
        scale.value = Math.max(0.1, Math.min(5, savedScale.value * e.scale));
      })
      .onEnd(() => {
        savedScale.value = scale.value;
        runOnJS(persist)(
          translateX.value,
          translateY.value,
          scale.value,
          image.id,
        );
      });

    // Race: pan wins with 1 finger, pinch wins with 2
    const composed = Gesture.Race(pan, pinch);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
        {scale: scale.value},
      ],
      opacity: image.opacity * globalOpacity,
    }));

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
            onError={() => {}}
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
