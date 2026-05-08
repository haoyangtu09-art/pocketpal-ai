import type {ReactNode} from 'react';
import React, {useContext} from 'react';
import {View, Animated} from 'react-native';

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
        // When LiquidGlass wraps this bubble, content bg must be transparent
        uiStore.useLiquidGlass &&
          currentUserIsAuthor && {backgroundColor: 'transparent'},
        {transform: [{scale}]},
      ]}>
      {child}
      {isAssistantText && (
        <View style={dateHeaderContainer} testID="message-footer">
          <PlayButton message={message} />
        </View>
      )}
    </Animated.View>
  );

  if (uiStore.useLiquidGlass && currentUserIsAuthor) {
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

  return bubbleContent;
};
