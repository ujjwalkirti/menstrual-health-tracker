import { View, Text, Image, ImageSourcePropType, TouchableOpacity, Dimensions } from "react-native";
import { useTheme } from "../../theme";

const { width } = Dimensions.get("window");

interface StepScreenProps {
	image: ImageSourcePropType;
	title: string;
	description: string;
	isLast: boolean;
	onNext: () => void;
	onSkip: () => void;
}

const StepScreen = ({ image, title, description, isLast, onNext, onSkip }: StepScreenProps) => {
	const { colors } = useTheme();
	return (
		<View style={{ width, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, backgroundColor: colors.background }}>
			<Image source={image} style={{ width: "100%", height: "50%" }} resizeMode="contain" />
			<Text style={{ fontSize: 35, fontWeight: "700", color: colors.textPrimary, marginTop: 20, marginBottom: 10, textAlign: "center" }}>{title}</Text>
			<Text style={{ fontSize: 16, textAlign: "center", color: colors.textSecondary, marginBottom: 20 }}>{description}</Text>
			<View style={{ gap: 10, width: "100%" }}>
				<TouchableOpacity onPress={onNext} style={{ width: "100%", height: 50, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: colors.period }}>
					<Text style={{ color: "white", fontSize: 16 }}>{isLast ? "Get Started" : "Next"}</Text>
				</TouchableOpacity>

				{!isLast && (
					<TouchableOpacity onPress={onSkip} style={{ width: "100%", height: 50, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
						<Text style={{ color: colors.period, fontSize: 16, fontWeight: "500" }}>Skip</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};

export default StepScreen;
