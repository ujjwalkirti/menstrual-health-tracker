import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme, withOpacity } from '../theme';

type Props = {
  message: string;
  tone: 'normal' | 'short' | 'long' | 'flagged';
  onDismiss: () => void;
};

export default function VariationCard({ message, tone, onDismiss }: Props) {
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
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.textPrimary }}>
        {message}
      </Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={8} accessibilityLabel="Dismiss">
        <Text style={{ fontSize: 18, color: colors.textSecondary, fontWeight: '600' }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}
