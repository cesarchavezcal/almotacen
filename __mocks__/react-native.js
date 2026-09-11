const React = require('react');

const Platform = {
  OS: 'ios',
  select: (obj) => (obj && obj.ios !== undefined ? obj.ios : obj ? obj.default : undefined),
};

const StyleSheet = {
  create: (styles) => styles,
  hairlineWidth: 0.5,
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
};

const createMockComponent = (name) => {
  const Comp = React.forwardRef((props, ref) => {
    return React.createElement(name, { ...props, ref }, props && props.children);
  });
  Comp.displayName = name;
  return Comp;
};

module.exports = {
  Platform,
  StyleSheet,
  View: createMockComponent('View'),
  Text: createMockComponent('Text'),
  Pressable: createMockComponent('Pressable'),
  TouchableOpacity: createMockComponent('TouchableOpacity'),
  ActivityIndicator: createMockComponent('ActivityIndicator'),
  ScrollView: createMockComponent('ScrollView'),
  Dimensions: {
    get: () => ({ width: 375, height: 812, scale: 3, fontScale: 1 }),
  },
};
