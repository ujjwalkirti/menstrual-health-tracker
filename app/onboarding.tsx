import { FlatList, KeyboardAvoidingView, Platform, View, Dimensions } from "react-native";
import { useRef, useState } from "react";
import { useTheme } from "../src/theme";
import StepScreen from "../src/components/onboarding/StepScreen";
import OnboardingForm from "../src/components/onboarding/OnboardingForm";

const { width } = Dimensions.get("window");

const IMAGES = {
	trackYourCycle: require("../assets/images/track-your-cycle.png"),
	predictYourPhases: require("../assets/images/predict-your-phases.png"),
	stayNotified: require("../assets/images/stay-notified.png"),
} as const;

const STEPS = [
	{ id: 1, title: "Track Your Cycle", description: "Track your menstrual cycle with ease and accuracy.", image: IMAGES.trackYourCycle },
	{ id: 2, title: "Predict Your Phases", description: "Get accurate predictions for your menstrual cycle.", image: IMAGES.predictYourPhases },
	{ id: 3, title: "Stay Notified", description: "Receive notifications about your menstrual cycle.", image: IMAGES.stayNotified },
];

export default function Onboarding() {
	const { colors } = useTheme();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [showForm, setShowForm] = useState(false); // ← controls what's visible
	const flatListRef = useRef<FlatList>(null);

	const handleNext = () => {
		if (currentIndex < STEPS.length - 1) {
			flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
		} else {
			setShowForm(true); // ← last step → show form
		}
	};

	const handleSkip = () => {
		setShowForm(true); // ← skip → jump straight to form
	};

	if (showForm) {
		return <OnboardingForm />; // ← swap out entire screen
	}

	return (
		<KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
			<FlatList
				ref={flatListRef}
				data={STEPS}
				keyExtractor={(item) => String(item.id)}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				scrollEnabled={false}
				onMomentumScrollEnd={(e) => {
					const index = Math.round(e.nativeEvent.contentOffset.x / width);
					setCurrentIndex(index);
				}}
				renderItem={({ item, index }) => <StepScreen image={item.image} title={item.title} description={item.description} isLast={index === STEPS.length - 1} onNext={handleNext} onSkip={handleSkip} />}
			/>
			{/* Dot indicators */}
			<View style={{ flexDirection: "row", justifyContent: "center", gap: 8, paddingBottom: 20 }}>
				{STEPS.map((_, i) => (
					<View
						key={i}
						style={{
							width: currentIndex === i ? 20 : 8,
							height: 8,
							borderRadius: 4,
							backgroundColor: currentIndex === i ? colors.period : colors.border,
						}}
					/>
				))}
			</View>
		</KeyboardAvoidingView>
	);
}
