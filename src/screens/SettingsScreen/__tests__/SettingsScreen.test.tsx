import React from 'react';
import {Platform, Keyboard} from 'react-native';

import {
  fireEvent,
  render as baseRender,
  waitFor,
  act,
} from '../../../../jest/test-utils';

import {SettingsScreen} from '../SettingsScreen';

import {modelStore, uiStore} from '../../../store';

jest.useFakeTimers();

const render = (ui: React.ReactElement, options: any = {}) =>
  baseRender(ui, {withBottomSheetProvider: true, ...options});

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Keyboard, 'dismiss');
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders settings screen correctly', async () => {
    const {getByText, getByDisplayValue} = render(<SettingsScreen />, {
      withSafeArea: true,
      withNavigation: true,
    });

    expect(getByText('Model Initialization Settings')).toBeTruthy();
    expect(getByText('App Settings')).toBeTruthy();
    expect(getByDisplayValue('2048')).toBeTruthy();
  });

  it('updates context size correctly', async () => {
    jest.useFakeTimers();
    const {getByDisplayValue} = render(<SettingsScreen />, {
      withSafeArea: true,
      withNavigation: true,
    });
    const contextSizeInput = getByDisplayValue('2048');

    act(() => {
      fireEvent.changeText(contextSizeInput, '512');
    });
    act(() => {
      fireEvent(contextSizeInput, 'blur');
    });

    act(() => {
      jest.advanceTimersByTime(501);
    });

    await waitFor(() => {
      expect(modelStore.setNContext).toHaveBeenCalledWith(512);
    });
  });

  it('displays error for invalid context size input', async () => {
    const {getByDisplayValue, getByText} = render(<SettingsScreen />, {
      withSafeArea: true,
      withNavigation: true,
    });
    const contextSizeInput = getByDisplayValue('2048');

    await act(async () => {
      fireEvent.changeText(contextSizeInput, '100');
    });

    expect(getByText('Please enter a valid number (minimum 200)')).toBeTruthy();
  });

  it('handles outside press correctly and resets input', async () => {
    const {getByDisplayValue, getByText} = render(<SettingsScreen />, {
      withSafeArea: true,
      withNavigation: true,
    });
    const contextSizeInput = getByDisplayValue('2048');

    fireEvent.changeText(contextSizeInput, '512');
    fireEvent.press(getByText('Model Initialization Settings'));

    await waitFor(() => {
      expect(Keyboard.dismiss).toHaveBeenCalled();
      expect(getByDisplayValue('2048')).toBeTruthy();
    });
  });

  it('toggles Dark Mode switch', async () => {
    const {getByTestId} = render(<SettingsScreen />, {
      withSafeArea: true,
      withNavigation: true,
    });
    const darkModeSwitch = getByTestId('dark-mode-switch');

    await act(async () => {
      fireEvent(darkModeSwitch, 'valueChange', true);
    });

    expect(uiStore.setColorScheme).toHaveBeenCalledWith('dark');
  });

  it('toggles GPU acceleration on iOS and adjusts GPU layers', async () => {
    Platform.OS = 'ios';
    jest.useFakeTimers();

    const {getByTestId} = render(<SettingsScreen />, {
      withSafeArea: true,
      withNavigation: true,
    });
    await waitFor(() => {
      expect(getByTestId('device-option-gpu')).toBeTruthy();
    });

    act(() => {
      fireEvent(getByTestId('device-option-gpu'), 'press');
    });

    expect(modelStore.setDevices).toHaveBeenCalledWith(['Metal']);

    act(() => {
      fireEvent(getByTestId('gpu-layers-slider'), 'valueChange', 60);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(modelStore.setNGPULayers).toHaveBeenCalledWith(60);
  });
});
