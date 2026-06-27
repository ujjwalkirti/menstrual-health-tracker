import { View, Text, Pressable } from 'react-native';
import { useTheme, withOpacity } from '../theme';

type Props = {
  message: string;
  tone: 'normal' | 'short' | 'long' | 'flagged';
  onDismiss: () => void;
  /** When provided, shows an "Undo" action (e.g. to reverse a mistaken period start). */
  onUndo?: () => void;
};

export default function VariationCard({ message, tone, onDismiss, onUndo }: Props) {
  const { colors } = useTheme();
  const accent = tone === 'flagged' ? colors.textSecondary : colors.brand;

  return (
    <View
      style={{
        width: '100%',
        marginTop: 16,
        backgroundColor: withOpacity(accent, 0.08),
        borderColor: withOpacity(accent, 0.35),
        borderWidth: 1,
        borderRadius: 16,
        borderCurve: 'continuous',
        padding: 16,
        boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.textPrimary }}>
          {message}
        </Text>
        <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Dismiss">
          <Text style={{ fontSize: 18, color: colors.textSecondary, fontWeight: '600' }}>×</Text>
        </Pressable>
      </View>

      {onUndo ? (
        <Pressable
          onPress={onUndo}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Undo period start"
          style={({ pressed }) => ({ alignSelf: 'flex-start', marginTop: 12, opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ fontSize: 14, fontWeight: '800', color: accent }}>Undo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
