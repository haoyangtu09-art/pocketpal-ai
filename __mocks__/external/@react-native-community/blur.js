const React = require('react');
const {View} = require('react-native');

const BlurView = ({children, style, testID}) =>
  React.createElement(View, {style, testID}, children);

const VibrancyView = ({children, style, testID}) =>
  React.createElement(View, {style, testID}, children);

module.exports = {BlurView, VibrancyView};
