const React = require('react');
const {View} = require('react-native');

const LiquidGlassView = ({children, style, testID}) =>
  React.createElement(View, {style, testID}, children);

module.exports = {
  LiquidGlassView,
  LIQUID_GLASS_DEFAULTS: {},
  LIQUID_GLASS_FROSTED: {},
  LIQUID_GLASS_CRYSTAL: {},
  LIQUID_GLASS_WARM: {},
};
