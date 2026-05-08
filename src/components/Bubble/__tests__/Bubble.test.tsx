import React from 'react';

import {Text} from 'react-native-paper';

import {render} from '../../../../jest/test-utils';

import {Bubble} from '../Bubble';
import {assistant} from '../../../utils/chat';

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const {Text: PaperText} = require('react-native-paper');
  return props => <PaperText>{props.name}</PaperText>;
});

describe('Bubble', () => {
  let mockMessage;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMessage = {
      author: {id: 'user1'},
      createdAt: 0,
      id: 'uuidv4',
      text: 'Hello, world!',
      type: 'text',
      metadata: {},
    };
  });

  const renderBubble = (message, child = 'Child content') => {
    return render(
      <Bubble
        child={<Text testID="child">{child}</Text>}
        message={message}
        nextMessageInGroup={false}
      />,
    );
  };

  it('renders child content', () => {
    const {getByTestId} = renderBubble(mockMessage);
    expect(getByTestId('child')).toBeTruthy();
  });

  it('shows footer for AI text messages', () => {
    const aiMessage = {
      ...mockMessage,
      author: {id: assistant.id},
    };
    const {getByTestId} = renderBubble(aiMessage);
    expect(getByTestId('message-footer')).toBeTruthy();
  });

  it('does not show footer for user messages', () => {
    const {queryByTestId} = renderBubble(mockMessage);
    expect(queryByTestId('message-footer')).toBeNull();
  });

  it('does not crash when message.metadata is undefined', () => {
    const messageWithoutMetadata = {...mockMessage, metadata: undefined};
    const {getByText} = renderBubble(messageWithoutMetadata);
    expect(getByText('Child content')).toBeTruthy();
  });
});
