const React = require('react');

const mockRouter = {
  push: () => {},
  replace: () => {},
  back: () => {},
  setParams: () => {},
};

module.exports = {
  useRouter: () => mockRouter,
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  usePathname: () => '/',
  Link: function MockLink(props) {
    return React.createElement('Link', props, props.children);
  },
  Stack: function MockStack(props) {
    return React.createElement('Stack', props, props.children);
  },
  Tabs: function MockTabs(props) {
    return React.createElement('Tabs', props, props.children);
  },
  Slot: function MockSlot(props) {
    return React.createElement('Slot', props, props.children);
  },
};
