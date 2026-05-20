import { Text, View } from "react-native";
import { useTheme } from "../theme";

function Section({ label, children, colors }: { label: string; children: React.ReactNode; colors: ReturnType<typeof useTheme>["colors"] }) {
	return (
		<View style={{ marginBottom: 8 }}>
			<Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary, marginTop: 20, marginBottom: 10, letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
			{children}
		</View>
	);
}

export default Section;
