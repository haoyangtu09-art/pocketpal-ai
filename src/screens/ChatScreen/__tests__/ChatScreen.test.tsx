import React from 'react';
import {runInAction} from 'mobx';

import {LlamaContext} from 'llama.rn';
import {
  render as baseRender,
  fireEvent,
  act,
  waitFor,
} from '../../../../jest/test-utils';
import {ChatScreen} from '../ChatScreen';

import {
  backgroundStore,
  chatSessionStore,
  modelStore,
  palStore,
  uiStore,
} from '../../../store';

import {l10n} from '../../../locales';
import {mockLlamaContextParams} from '../../../../jest/fixtures/models';
import type {Pal} from '../../../types/pal';

const render = (ui: React.ReactElement, options: any = {}) =>
  baseRender(ui, {withBottomSheetProvider: true, ...options});

describe('ChatScreen', () => {
  let llamaRN;

  beforeEach(() => {
    jest.clearAllMocks();
    llamaRN = require('llama.rn');
    (backgroundStore as any).images = [];
    (backgroundStore as any).isReady = true;
    (backgroundStore as any).globalOpacity = 0.5;
    (palStore as any).pals = [];
    (uiStore as any).isBackgroundEditMode = false;
    (uiStore as any).showDefaultBackground = true;
    Object.defineProperty(chatSessionStore, 'activePalId', {
      get: jest.fn(() => null),
      configurable: true,
    });
  });

  it('renders correctly when model is not loaded', () => {
    const {getByPlaceholderText} = render(<ChatScreen />, {
      withNavigation: true,
    });
    expect(getByPlaceholderText(l10n.en.chat.modelNotLoaded)).toBeTruthy();
  });

  it('renders correctly when model is loading', () => {
    modelStore.isContextLoading = true;
    const {getByPlaceholderText} = render(<ChatScreen />, {
      withNavigation: true,
    });
    expect(getByPlaceholderText(l10n.en.chat.loadingModel)).toBeTruthy();
  });

  it('renders correctly when model is loaded', () => {
    modelStore.context = new LlamaContext(mockLlamaContextParams);
    modelStore.engine = {
      completion: jest.fn((params, onData) =>
        modelStore.context!.completion(params, onData),
      ),
      stopCompletion: jest.fn(),
    };
    const {getByPlaceholderText} = render(<ChatScreen />, {
      withNavigation: true,
    });
    expect(getByPlaceholderText(l10n.en.chat.typeYourMessage)).toBeTruthy();
  });

  it('handles sending a message', async () => {
    // Set up an active model for the test
    runInAction(() => {
      modelStore.activeModelId = 'test-model-id';
      modelStore.context = new LlamaContext(mockLlamaContextParams);
    });
    modelStore.context!.completion = jest.fn().mockResolvedValue({
      timings: {predicted_per_token_ms: 10, predicted_per_second: 100},
    });
    modelStore.engine = {
      completion: jest.fn((params, onData) =>
        modelStore.context!.completion(params, onData),
      ),
      stopCompletion: jest.fn(),
    };

    const {getByPlaceholderText, getByTestId} = render(<ChatScreen />, {
      withNavigation: true,
    });
    const input = getByPlaceholderText(l10n.en.chat.typeYourMessage);

    await act(async () => {
      fireEvent.changeText(input, 'Hello, Lumo!');
    });

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(chatSessionStore.addMessageToCurrentSession).toHaveBeenCalledWith(
        expect.objectContaining({
          author: expect.objectContaining({id: 'y9d7f8pgn'}),
          text: 'Hello, Lumo!',
        }),
      );
    });

    await waitFor(() => {
      expect(modelStore.context).toBeTruthy();
      if (modelStore.context) {
        expect(modelStore.context.completion).toHaveBeenCalled();
      }
    });
  });

  it('handles sending a message failure', async () => {
    // Set up an active model for the test
    runInAction(() => {
      modelStore.activeModelId = 'test-model-id';
      modelStore.context = new LlamaContext(mockLlamaContextParams);
    });
    modelStore.context!.completion = jest
      .fn()
      .mockRejectedValue(new Error('Completion failed'));
    modelStore.engine = {
      completion: jest.fn((params, onData) =>
        modelStore.context!.completion(params, onData),
      ),
      stopCompletion: jest.fn(),
    };

    const {getByPlaceholderText, getByTestId} = render(<ChatScreen />, {
      withNavigation: true,
    });
    const input = getByPlaceholderText(l10n.en.chat.typeYourMessage);

    await act(async () => {
      fireEvent.changeText(input, 'Hello, Lumo!');
    });

    const sendButton = getByTestId('send-button');
    await act(async () => {
      fireEvent.press(sendButton);
    });

    expect(chatSessionStore.addMessageToCurrentSession).toHaveBeenCalledWith(
      expect.objectContaining({
        author: expect.objectContaining({id: 'h3o3lc5xj'}),
        text: 'Completion failed: Completion failed',
        metadata: expect.objectContaining({system: true}),
      }),
    );
  });

  it('renders different message types correctly', async () => {
    modelStore.context = new LlamaContext(mockLlamaContextParams);
    modelStore.engine = {
      completion: jest.fn((params, onData) =>
        modelStore.context!.completion(params, onData),
      ),
      stopCompletion: jest.fn(),
    };
    jest
      .spyOn(chatSessionStore, 'currentSessionMessages', 'get')
      .mockReturnValue([
        {
          id: 'unique-message-id-1',
          author: {id: 'y9d7f8pgn'},
          text: 'User message',
          type: 'text',
        },
        {
          id: 'unique-message-id-2',
          author: {id: 'h3o3lc5xj'},
          text: 'Assistant message',
          type: 'text',
        },
        {
          id: 'unique-message-id-3',
          author: {id: 'system'},
          text: 'System message',
          type: 'text',
        },
      ]);

    const {getByText} = render(<ChatScreen />, {
      withNavigation: true,
    });

    expect(getByText('User message')).toBeTruthy();
    expect(getByText('Assistant message')).toBeTruthy();
    expect(getByText('System message')).toBeTruthy();
  });

  it('stops ongoing completion when stop button is pressed', async () => {
    modelStore.context = new llamaRN.LlamaContext({
      contextId: 1,
      gpu: false,
      reasonNoGPU: '',
      model: {},
    });
    if (modelStore.context) {
      modelStore.context.completion = jest
        .fn()
        .mockReturnValue(new Promise(() => {})); // Never resolves
    }
    modelStore.engine = {
      completion: jest.fn((params, onData) =>
        modelStore.context!.completion(params, onData),
      ),
      stopCompletion: jest.fn(),
    };

    const {getByPlaceholderText, getByTestId} = render(<ChatScreen />, {
      withNavigation: true,
    });
    const input = getByPlaceholderText(l10n.en.chat.typeYourMessage);

    await act(async () => {
      fireEvent.changeText(input, 'Hello, AI!');
    });

    await act(async () => {
      const sendButton = getByTestId('send-button');
      fireEvent.press(sendButton);
      modelStore.setInferencing(true); // since mock doesn't really set inferencing
    });

    await waitFor(
      () => {
        expect(getByTestId('stop-button')).toBeTruthy();
      },
      {
        timeout: 1000,
      },
    );

    const stopButton = getByTestId('stop-button');
    await act(async () => {
      fireEvent.press(stopButton);
    });

    expect(modelStore.engine?.stopCompletion).toHaveBeenCalled();
  });

  it('shows imported backgrounds and edit close button for normal chat', () => {
    (backgroundStore as any).images = [
      {
        id: 'bg-1',
        uri: 'file://background.jpg',
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
      },
    ];
    (uiStore as any).isBackgroundEditMode = true;

    const {getByTestId} = render(<ChatScreen />, {
      withNavigation: true,
    });

    expect(getByTestId('background-layer')).toBeTruthy();
    expect(getByTestId('background-layer').props.pointerEvents).toBe('auto');
  });

  it('shows imported backgrounds while a video pal is active', () => {
    const videoPal = {
      type: 'local',
      id: 'video-pal',
      name: 'Video Pal',
      description: '',
      systemPrompt: '',
      isSystemPromptChanged: false,
      useAIPrompt: false,
      parameterSchema: [],
      parameters: {},
      source: 'local',
      capabilities: {video: true, multimodal: true},
    } as Pal;
    (palStore as any).pals = [videoPal];
    Object.defineProperty(chatSessionStore, 'activePalId', {
      get: jest.fn(() => videoPal.id),
      configurable: true,
    });
    (backgroundStore as any).images = [
      {
        id: 'bg-1',
        uri: 'file://background.jpg',
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
      },
    ];
    (uiStore as any).isBackgroundEditMode = true;

    const {getByTestId} = render(<ChatScreen />, {
      withNavigation: true,
      withSafeArea: true,
    });

    expect(getByTestId('background-layer')).toBeTruthy();
    expect(getByTestId('background-layer').props.pointerEvents).toBe('auto');
  });
});
