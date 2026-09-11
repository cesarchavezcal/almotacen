const React = require('react');

const LinearGradient = function MockLinearGradient(props) {
  return React.createElement('LinearGradient', props, props.children);
};

module.exports = {
  LinearGradient,
};
