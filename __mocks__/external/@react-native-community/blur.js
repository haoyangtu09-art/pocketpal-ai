import React from 'react';
import {View} from 'react-native';

export const BlurView = ({children, style, ...rest}) =>
  React.createElement(View, {style, testID: rest.testID}, children);

export const VibrancyView = ({children, style, ...rest}) =>
  React.createElement(View, {style, testID: rest.testID}, children);
