import React, {useMemo} from 'react';
import {StyleSheet, useWindowDimensions} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import {observer} from 'mobx-react';
import {backgroundStore, type BackgroundImage} from '../../store';
import {saveCrashLog} from '../../utils/crashLog';

interface Props {
  image: BackgroundImage;
  isEditing: boolean;
  globalOpacity: number;
}

function safeNum(v: number | undefined, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export const BackgroundLayer = observer(
  ({image, isEditing, globalOpacity}: Props) => {
    const {width: screenWidth, height: screenHeight} = useWindowDimensions();
    const translateX = useSharedValue(safeNum(image.x, 0));
    const translateY = useSharedValue(safeNum(image.y, 0));
    const scale = useSharedValue(safeNum(image.scale, 1));
    const savedTx = useSharedValue(safeNum(image.x, 0));
    const savedTy = useSharedValue(safeNum(image.y, 0));
    const savedScale = useSharedValue(safeNum(image.scale, 1));

    const persist = (x: number, y: number, s: number) => {
      try {
        backgroundStore.updateImageTransform(image.id, {
          x: safeNum(x, 0),
          y: safeNum(y, 0),
          scale: safeNum(s, 1),
        });
      } catch {
        // ignore
      }
    };

    // Stable gesture objects — only recreated when isEditing changes
    const composed = useMemo(() => {
      const pan = Gesture.Pan()
        .enabled(isEditing)
        .onUpdate(e => {
          translateX.value = savedTx.value + e.translationX;
          translateY.value = savedTy.value + e.translationY;
        })
        .onEnd(() => {
          savedTx.value = translateX.value;
          savedTy.value = translateY.value;
          runOnJS(persist)(translateX.value, translateY.value, scale.value);
        });

      const pinch = Gesture.Pinch()
        .enabled(isEditing)
        .onUpdate(e => {
          scale.value = Math.max(0.1, Math.min(5, savedScale.value * e.scale));
        })
        .onEnd(() => {
          savedScale.value = scale.value;
          runOnJS(persist)(translateX.value, translateY.value, scale.value);
        });

      return Gesture.Race(pan, pinch);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
        {scale: scale.value},
      ],
      opacity:
        safeNum(image.opacity, 1) * Math.max(0, Math.min(1, globalOpacity)),
    }));

    const imageSource = useMemo(() => {
      try {
        return image.uri ? {uri: image.uri} : undefined;
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
          <FastImage
            source={imageSource}
            style={[styles.image, {width: screenWidth, height: screenHeight}]}
            resizeMode={FastImage.resizeMode.contain}
            onError={() => {
              saveCrashLog({
                message: `BackgroundLayer Image load failed`,
                context: `uri=${image.uri?.slice(0, 80)}, id=${image.id}`,
              });
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
  image: {},
  editingBorder: {
    borderWidth: 2,
    borderColor: 'rgba(100, 150, 255, 0.6)',
    borderStyle: 'dashed',
    borderRadius: 4,
    padding: 4,
  },
});
