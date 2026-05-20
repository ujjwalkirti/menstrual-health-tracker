import { Text, TouchableOpacity } from "react-native";
import { useTheme, withOpacity } from "../theme";

function EmojiChip({ label, emoji, active, onPress, colors }: { label: string; emoji: string; active: boolean; onPress: () => void; colors: ReturnType<typeof useTheme>["colors"] }) {
	return (
		<TouchableOpacity
			onPress={onPress}
			activeOpacity={0.7}
			style={{
				flexDirection: "row",
				alignItems: "center",
				gap: 6,
				paddingHorizontal: 14,
				paddingVertical: 9,
				borderRadius: 24,
				borderWidth: 1,
				backgroundColor: active ? withOpacity(colors.brand, 0.1) : colors.surface,
				borderColor: active ? colors.brand : colors.border,
			}}
		>
			<Text style={{ fontSize: 15 }}>{emoji}</Text>
			<Text style={{ fontSize: 13, fontWeight: active ? "700" : "400", color: active ? colors.brand : colors.textSecondary }}>{label}</Text>
		</TouchableOpacity>
	);
}

export default EmojiChip;
