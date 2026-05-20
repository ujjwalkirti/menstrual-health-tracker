import { useState } from "react";
import { Text, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useTheme, withOpacity } from "../../theme";
import { useAppStore } from "../../store/useAppStore";
import { formatFull, toISODate, addDays, fromISODate } from "../../utils/date";

export default function OnboardingForm() {
	const { colors } = useTheme();
	const updateSettings = useAppStore((s) => s.updateSettings);
	const addCycle = useAppStore((s) => s.addCycle);
	const [cycleLength, setCycleLength] = useState("28");
	const [periodDuration, setPeriodDuration] = useState("5");
	const [lastPeriodStart, setLastPeriodStart] = useState(toISODate(new Date()));
	const [showPicker, setShowPicker] = useState(false);

	const handleSubmit = async () => {
		const cl = parseInt(cycleLength, 10) || 28;
		const pd = parseInt(periodDuration, 10) || 5;
		const startDate = lastPeriodStart || toISODate(new Date());
		const endDate = toISODate(addDays(fromISODate(startDate), pd - 1));
		await updateSettings({ cycleLength: cl, periodDuration: pd, lastPeriodStart: startDate, hasOnboarded: true });
		await addCycle({ id: startDate, startDate, endDate });
		router.replace("/(tabs)/home");
	};

	const handleSkip = async () => {
		await updateSettings({ hasOnboarded: true });
		router.replace("/(tabs)/home");
	};

	const inputStyle = {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 12,
		borderCurve: "continuous" as const,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: colors.textPrimary,
	};

	const labelStyle = {
		fontSize: 13,
		color: colors.textSecondary,
		fontWeight: "600" as const,
		marginBottom: 8,
	};

	return (
		<ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ flexGrow: 1, padding: 28, justifyContent: "center", backgroundColor: colors.background }} contentInsetAdjustmentBehavior="automatic">
			<Text style={{ fontSize: 38, fontWeight: "800", color: colors.brand, marginBottom: 6 }}>Welcome</Text>
			<Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 40 }}>Let's personalise your tracker</Text>

			<Text style={labelStyle}>Average cycle length (days)</Text>
			<TextInput style={{ ...inputStyle, marginBottom: 20 }} value={cycleLength} onChangeText={setCycleLength} keyboardType="number-pad" placeholder="28" placeholderTextColor={colors.textSecondary} />

			<Text style={labelStyle}>Period duration (days)</Text>
			<TextInput style={{ ...inputStyle, marginBottom: 20 }} value={periodDuration} onChangeText={setPeriodDuration} keyboardType="number-pad" placeholder="5" placeholderTextColor={colors.textSecondary} />

			<Text style={labelStyle}>Last period start date</Text>
			<TouchableOpacity style={{ ...inputStyle, marginBottom: 8, justifyContent: "center" }} onPress={() => setShowPicker(true)}>
				<Text style={{ fontSize: 16, color: colors.textPrimary }}>{formatFull(lastPeriodStart)}</Text>
			</TouchableOpacity>

			{showPicker && (
				<DateTimePicker
					value={new Date(lastPeriodStart)}
					mode="date"
					display={Platform.OS === "ios" ? "spinner" : "default"}
					maximumDate={new Date()}
					onChange={(_event, date) => {
						setShowPicker(Platform.OS === "ios");
						if (date) setLastPeriodStart(toISODate(date));
					}}
				/>
			)}

			<TouchableOpacity
				onPress={handleSubmit}
				activeOpacity={0.85}
				style={{
					backgroundColor: colors.brand,
					borderRadius: 20,
					borderCurve: "continuous",
					paddingVertical: 18,
					alignItems: "center",
					marginTop: 32,
					boxShadow: `0px 6px 14px ${withOpacity(colors.brand, 0.35)}`,
				}}
			>
				<Text style={{ color: "#FFF", fontSize: 17, fontWeight: "800" }}>Get Started</Text>
			</TouchableOpacity>

			<TouchableOpacity onPress={handleSkip} style={{ alignItems: "center", marginTop: 16, paddingVertical: 8 }}>
				<Text style={{ color: colors.textSecondary, fontSize: 14 }}>Skip — use defaults</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}
