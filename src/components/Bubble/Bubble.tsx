import type {ReactNode} from 'react';
import React, {useContext, useEffect, useRef} from 'react';
import {View, Animated, Easing} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {useTheme} from '../../hooks';
import {uiStore} from '../../store';
import {LiquidGlass} from '../LiquidGlass';

import {styles} from './styles';
import {PlayButton} from '../TextMessage/PlayButton';

import {UserContext} from '../../utils';
import {assistant} from '../../utils/chat';
import {MessageType} from '../../utils/types';

export const Bubble = ({
  child,
  message,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  nextMessageInGroup,
  scale = new Animated.Value(1),
}: {
  child: ReactNode;
  message: MessageType.Any;
  nextMessageInGroup: boolean;
  scale?: Animated.Value;
}) => {
  const theme = useTheme();
  const user = useContext(UserContext);
  const currentUserIsAuthor = user?.id === message.author.id;

  const {contentContainer, dateHeaderContainer} = styles({
    currentUserIsAuthor,
    message,
    roundBorder: true,
    theme,
  });

  const isAssistantText =
    message.author?.id === assistant.id && message.type === 'text';

  const bubbleContent = (
    <Animated.View
      testID={currentUserIsAuthor ? 'user-message' : 'ai-message'}
      style={[
        contentContainer,
        currentUserIsAuthor && {backgroundColor: 'transparent'},
        {transform: [{scale}]},
        currentUserIsAuthor && glowStyles.glow,
      ]}>
      {child}
      {isAssistantText && (
        <View style={dateHeaderContainer} testID="message-footer">
          <PlayButton message={message} />
          <AIPresenceIndicator />
        </View>
      )}
    </Animated.View>
  );

  if (currentUserIsAuthor) {
    if (uiStore.useLiquidGlass) {
      return (
        <LiquidGlass
          cornerRadius={theme.borders.messageBorderRadius}
          blurAmount={8}
          tintColor={
            theme.dark ? 'rgba(30,30,40,0.60)' : 'rgba(235,235,245,0.45)'
          }>
          {bubbleContent}
        </LiquidGlass>
      );
    }
    return (
      <LinearGradient
        colors={theme.dark ? ['#2a1a5e', '#141430'] : ['#d8d8f8', '#e8e8f8']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{
          borderRadius: theme.borders.messageBorderRadius,
          overflow: 'hidden',
          ...glowStyles.glow,
        }}>
        {bubbleContent}
      </LinearGradient>
    );
  }

  return bubbleContent;
};

// Minimal AI presence indicator — tiny pulsing dot replacing old t/s debug info
const AIPresenceIndicator: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return <Animated.View style={[presenceStyles.dot, {opacity: pulseAnim}]} />;
};

const presenceStyles = {
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(130,150,220,0.7)',
    marginLeft: 8,
  },
};

// Shared glow style for user bubbles
const glowStyles = {
  glow: {
    shadowColor: '#5a4ae3',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
