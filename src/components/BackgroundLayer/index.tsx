import React from 'react';
import {Image, StyleSheet} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
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
    const scale = useSharedValue(image.scale);
    const rotation = useSharedValue(image.rotation);
    const translateX = useSharedValue(image.x);
    const translateY = useSharedValue(image.y);
    const savedScale = useSharedValue(image.scale);
    const savedRotation = useSharedValue(image.rotation);
    const savedTranslateX = useSharedValue(image.x);
    const savedTranslateY = useSharedValue(image.y);

    const composed = Gesture.Simultaneous(
      Gesture.Pan()
        .onUpdate(e => {
          if (!isEditing) {
            return;
          }
          translateX.value = savedTranslateX.value + e.translationX;
          translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd(() => {
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
          backgroundStore.updateImageTransform(image.id, {
            x: translateX.value,
            y: translateY.value,
          });
        }),
      Gesture.Pinch()
        .onUpdate(e => {
          if (!isEditing) {
            return;
          }
          scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
          savedScale.value = scale.value;
          backgroundStore.updateImageTransform(image.id, {
            scale: scale.value,
          });
        }),
      Gesture.Rotation()
        .onUpdate(e => {
          if (!isEditing) {
            return;
          }
          rotation.value = savedRotation.value + e.rotation;
        })
        .onEnd(() => {
          savedRotation.value = rotation.value;
          backgroundStore.updateImageTransform(image.id, {
            rotation: rotation.value,
          });
        }),
    );

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
        {scale: scale.value},
        {rotate: `${rotation.value}rad`},
      ],
      opacity: image.opacity * globalOpacity,
    }));

    return (
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            styles.layer,
            animatedStyle,
            isEditing && styles.editingBorder,
          ]}>
          <Image
            source={{uri: image.uri}}
            style={styles.image}
            resizeMode="contain"
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
