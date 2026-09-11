const React = require('react');

const createMockIcon = (name) => {
  return function MockIcon(props) {
    return React.createElement('Icon', { ...props, name });
  };
};

module.exports = {
  Ionicons: createMockIcon('Ionicons'),
  AntDesign: createMockIcon('AntDesign'),
  MaterialIcons: createMockIcon('MaterialIcons'),
  FontAwesome: createMockIcon('FontAwesome'),
};
