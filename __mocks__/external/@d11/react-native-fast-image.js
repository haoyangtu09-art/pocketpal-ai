const React = require('react');
const {View} = require('react-native');

const FastImage = React.forwardRef((props, ref) =>
  React.createElement(View, {...props, ref}),
);

FastImage.resizeMode = {
  contain: 'contain',
  cover: 'cover',
  stretch: 'stretch',
  center: 'center',
};

FastImage.priority = {
  low: 'low',
  normal: 'normal',
  high: 'high',
};

FastImage.cacheControl = {
  immutable: 'immutable',
  web: 'web',
  cacheOnly: 'cacheOnly',
};

FastImage.preload = jest.fn();
FastImage.clearMemoryCache = jest.fn();
FastImage.clearDiskCache = jest.fn();

module.exports = FastImage;
module.exports.default = FastImage;
