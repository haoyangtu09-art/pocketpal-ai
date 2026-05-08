import React, {useContext, useEffect, useRef} from 'react';
import {Animated, View, StyleSheet, Easing} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {observer} from 'mobx-react';
import {NavigationProp, useNavigation} from '@react-navigation/native';

import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {modelStore} from '../../store';
import {L10nContext} from '../../utils';

interface ChatEmptyPlaceholderProps {
  onSelectModel: () => void;
  bottomComponentHeight: number;
}

export const ChatEmptyPlaceholder = observer(
  ({onSelectModel, bottomComponentHeight}: ChatEmptyPlaceholderProps) => {
    const theme = useTheme();
    const navigation = useNavigation<NavigationProp<any>>();
    const l10n = useContext(L10nContext);
    const styles = createStyles({theme});

    const hasAvailableModels = modelStore.availableModels.length > 0;
    const hasActiveModel = modelStore.activeModelId !== undefined;

    const getContent = () => {
      if (!hasAvailableModels) {
        return {
          title: l10n.components.chatEmptyPlaceholder.noModelsTitle,
          description: l10n.components.chatEmptyPlaceholder.noModelsDescription,
          buttonText: l10n.components.chatEmptyPlaceholder.noModelsButton,
          onPress: () => navigation.navigate('Models'),
        };
      }
      return {
        title: l10n.components.chatEmptyPlaceholder.activateModelTitle,
        description:
          l10n.components.chatEmptyPlaceholder.activateModelDescription,
        buttonText: l10n.components.chatEmptyPlaceholder.activateModelButton,
        onPress: onSelectModel,
      };
    };

    const {title, description, buttonText, onPress} = getContent();

    if (hasActiveModel) {
      return <View />;
    }

    return (
      <View
        style={[styles.container, {marginBottom: bottomComponentHeight + 100}]}>
        <BreathingCore color={theme.colors.primary} />
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <Button
          mode="contained"
          onPress={onPress}
          style={styles.button}
          loading={modelStore.isContextLoading}
          disabled={hasActiveModel}>
          {modelStore.isContextLoading
            ? l10n.components?.chatEmptyPlaceholder?.loading
            : buttonText}
        </Button>
      </View>
    );
  },
);

// Breathing energy core — concentric circles with pulsing animation
const BreathingCore: React.FC<{color: string}> = ({color}) => {
  const outerScale = useRef(new Animated.Value(1)).current;
  const innerOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(outerScale, {
            toValue: 1.2,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(outerScale, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(innerOpacity, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(innerOpacity, {
            toValue: 0.5,
            duration: 1300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, [outerScale, innerOpacity]);

  return (
    <View style={cs.coreContainer}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          cs.outerRing,
          {
            borderColor: color,
            transform: [{scale: outerScale}],
          },
        ]}>
        {/* Stardust dots around the ring */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <StardustDot key={angle} angle={angle} color={color} />
        ))}
      </Animated.View>
      {/* Inner core */}
      <Animated.View
        style={[cs.innerCore, {backgroundColor: color, opacity: innerOpacity}]}
      />
      {/* Center dot */}
      <View style={[cs.centerDot, {backgroundColor: color}]} />
    </View>
  );
};

// Tiny particle orbiting the outer ring
const StardustDot: React.FC<{angle: number; color: string}> = ({
  angle,
  color,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const delay = angle * 5;
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim, angle]);

  const rad = (angle * Math.PI) / 180;
  const cx = 42 + Math.cos(rad) * 42;
  const cy = 42 + Math.sin(rad) * 42;

  return (
    <Animated.View
      style={[
        cs.stardust,
        {
          left: cx,
          top: cy,
          backgroundColor: color,
          opacity: fadeAnim,
        },
      ]}
    />
  );
};

const cs = StyleSheet.create({
  coreContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    alignSelf: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
  },
  innerCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  centerDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.9,
  },
  stardust: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
