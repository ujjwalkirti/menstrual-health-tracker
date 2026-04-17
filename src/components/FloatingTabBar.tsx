import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme, withOpacity } from '../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { outline: IoniconsName; filled: IoniconsName; label: string }> = {
  home:     { outline: 'home-outline',     filled: 'home',     label: 'Home' },
  calendar: { outline: 'calendar-outline', filled: 'calendar', label: 'Calendar' },
  settings: { outline: 'settings-outline', filled: 'settings', label: 'Settings' },
};

const PILL_HEIGHT = 62;
const BOTTOM_MARGIN = 20;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tabWidth, setTabWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabWidth === 0) return;
    Animated.spring(indicatorX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [state.index, tabWidth]);

  const totalTabs = state.routes.length;

  return (
    <View
      style={[styles.wrapper, { bottom: insets.bottom + BOTTOM_MARGIN }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.surface,
            borderColor: withOpacity(colors.border, 0.8),
            shadowColor: colors.brand,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
            elevation: 12,
          },
        ]}
        onLayout={(e) => setTabWidth(e.nativeEvent.layout.width / totalTabs)}
      >
        {/* Sliding active blob */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidth - 12,
                height: PILL_HEIGHT - 12,
                backgroundColor: withOpacity(colors.brand, 0.12),
                transform: [{ translateX: Animated.add(indicatorX, new Animated.Value(6)) }],
              },
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] ?? {
            outline: 'ellipse-outline' as IoniconsName,
            filled: 'ellipse' as IoniconsName,
            label: route.name,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
            >
              <Ionicons
                name={isFocused ? config.filled : config.outline}
                size={22}
                color={isFocused ? colors.brand : colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 3,
                  fontWeight: isFocused ? '700' : '400',
                  color: isFocused ? colors.brand : colors.textSecondary,
                }}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    height: PILL_HEIGHT,
    width: '76%',
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    borderRadius: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});
