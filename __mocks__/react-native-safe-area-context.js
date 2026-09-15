const React = require('react');

const SafeAreaView = ({ children, style, edges, ...props }) => {
  return React.createElement('View', { style, ...props }, children);
};

const SafeAreaProvider = ({ children }) => children;
const SafeAreaConsumer = ({ children }) => children({ top: 0, bottom: 0, left: 0, right: 0 });

const useSafeAreaInsets = () => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

const initialWindowMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

module.exports = {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaConsumer,
  useSafeAreaInsets,
  initialWindowMetrics,
};
