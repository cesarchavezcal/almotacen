import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { Button, ButtonProps } from '../Button';

function renderButton(props: ButtonProps) {
  return React.createElement(Button, props) as React.ReactElement<any>;
}

describe('Button Component (SCEN-040, SCEN-041, SCEN-042, SCEN-046)', () => {
  it('SCEN-040: exposes accessibilityRole="button" and executes onPress handler', () => {
    const onPressMock = jest.fn();
    const element = renderButton({ title: 'Transfer', onPress: onPressMock });

    expect(element.type).toBe(Button);
    expect(element.props.title).toBe('Transfer');

    // Simulate direct forwardRef execution with props
    const rendered = (Button as any).render({
      title: 'Transfer',
      onPress: onPressMock,
    }, null);

    expect(rendered.props.accessibilityRole).toBe('button');
    expect(rendered.props.accessibilityState?.disabled).toBe(false);

    rendered.props.onPress();
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('SCEN-041: disabled button marks accessibilityState.disabled=true and blocks onPress', () => {
    const onPressMock = jest.fn();
    const rendered = (Button as any).render({
      title: 'Disabled Action',
      disabled: true,
      onPress: onPressMock,
    }, null);

    expect(rendered.props.accessibilityRole).toBe('button');
    expect(rendered.props.accessibilityState?.disabled).toBe(true);
    expect(rendered.props.onPress).toBeUndefined();
  });

  it('SCEN-042: loading button sets accessibilityState.busy=true and disables press', () => {
    const onPressMock = jest.fn();
    const rendered = (Button as any).render({
      title: 'Saving...',
      loading: true,
      onPress: onPressMock,
    }, null);

    expect(rendered.props.accessibilityRole).toBe('button');
    expect(rendered.props.accessibilityState?.busy).toBe(true);
    expect(rendered.props.accessibilityState?.disabled).toBe(true);
    expect(rendered.props.onPress).toBeUndefined();
  });
});
