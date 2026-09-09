import React, { useState, useEffect, ReactNode } from 'react';
import {
  ScrollView,
  Pressable,
  View,
  Dimensions,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

const PEEK = 80;
const CARD_HEIGHT = 220;
const SCREEN_H = Dimensions.get('window').height;

export interface CardStackProps {
  cards: ReactNode[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  onCardPress?: (index: number, isExpanded: boolean) => void;
}

export function CardStack({ cards, contentContainerStyle, onCardPress }: CardStackProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleCardPress = (idx: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore if haptics are not supported in current environment
    }
    setExpandedIdx((prev) => {
      const next = prev === idx ? null : idx;
      onCardPress?.(idx, next !== null);
      return next;
    });
  };

  const stackHeight = expandedIdx !== null
    ? CARD_HEIGHT + 240
    : Math.max(cards.length * PEEK + CARD_HEIGHT, CARD_HEIGHT + 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.stackContainer, { height: stackHeight }]}>
        {cards.map((card, idx) => (
          <CardItem
            key={idx}
            idx={idx}
            isExpanded={expandedIdx === idx}
            isAnyExpanded={expandedIdx !== null}
            onPress={() => handleCardPress(idx)}
          >
            {card}
          </CardItem>
        ))}
      </View>
    </ScrollView>
  );
}

interface CardItemProps {
  idx: number;
  isExpanded: boolean;
  isAnyExpanded: boolean;
  onPress: () => void;
  children: ReactNode;
}

function CardItem({ idx, isExpanded, isAnyExpanded, onPress, children }: CardItemProps) {
  const translateY = useSharedValue(idx * PEEK);

  useEffect(() => {
    if (isExpanded) {
      translateY.value = withSpring(16, { damping: 16, mass: 0.8 });
    } else if (isAnyExpanded) {
      translateY.value = withTiming(SCREEN_H, { duration: 350 });
    } else {
      translateY.value = withSpring(idx * PEEK, { damping: 16, mass: 0.8 });
    }
  }, [isExpanded, isAnyExpanded, idx, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: isExpanded ? 100 : idx,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={onPress} style={styles.pressable}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingBottom: 120,
  },
  stackContainer: {
    position: 'relative',
    paddingTop: 16,
  },
  pressable: {
    width: '100%',
  },
});
