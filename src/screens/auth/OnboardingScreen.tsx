// @ts-nocheck
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppColors } from "../../styles/colors";
import { s, vs } from "react-native-size-matters";

const windowWidth = Dimensions.get("window").width;

const steps = {
  welcome: {
    index: 0,
    title: "Your Gym. Your Fitness. One App.",
    body:
      "Classy Fit gives gym members convenient access to your gym's services and resources in one simple place.",
    icon: "fitness-outline",
  },
  features: {
    index: 1,
    title: "Everything your membership needs",
    body: "Book classes, train, shop, and manage your membership from one app.",
    icon: "list-outline",
  },
  getStarted: {
    index: 2,
    title: "Ready to get started?",
    body: "Sign in or create your account to connect with your gym.",
    icon: "rocket-outline",
  },
} as const;

const featureItems = [
  { icon: "calendar-outline", label: "Book fitness classes" },
  { icon: "person-outline", label: "Book personal training" },
  { icon: "bag-outline", label: "Shop gym products" },
  { icon: "barbell-outline", label: "View equipment and workout resources" },
  { icon: "card-outline", label: "Manage your gym membership" },
] as const;

const OnboardingScreen = ({
  navigation,
  step,
  onComplete,
}: {
  navigation: any;
  step: keyof typeof steps;
  onComplete: () => Promise<void> | void;
}) => {
  const currentStep = steps[step];
  const showBack = currentStep.index > 0;
  const showSkip = currentStep.index < 2;

  const goToNext = () => {
    if (step === "welcome") {
      navigation.navigate("OnboardingFeatures");
      return;
    }

    if (step === "features") {
      navigation.navigate("OnboardingGetStarted");
    }
  };

  const goBack = () => {
    if (step === "features") {
      navigation.goBack();
      return;
    }

    if (step === "getStarted") {
      navigation.goBack();
    }
  };

  const completeAndContinue = async () => {
    await onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.topAction}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back to the previous onboarding screen"
          >
            <Ionicons name="arrow-back" size={22} color={AppColors.blue} />
            <Text style={styles.topActionText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.topActionSpacer} />
        )}

        {showSkip ? (
          <TouchableOpacity
            style={styles.topAction}
            onPress={completeAndContinue}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.topActionText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.topActionSpacer} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name={currentStep.icon} size={44} color={AppColors.blue} />
        </View>

        <Text style={styles.title}>{currentStep.title}</Text>
        <Text style={styles.body}>{currentStep.body}</Text>

        {step === "features" ? (
          <View style={styles.featureList}>
            {featureItems.map((item) => (
              <View key={item.label} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={item.icon} size={18} color={AppColors.blue} />
                </View>
                <Text style={styles.featureText}>{item.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityLabel="Onboarding progress">
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep.index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {step !== "getStarted" ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToNext}
            accessibilityRole="button"
            accessibilityLabel="Go to the next onboarding screen"
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={completeAndContinue}
              accessibilityRole="button"
              accessibilityLabel="Sign in and continue"
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={completeAndContinue}
              accessibilityRole="button"
              accessibilityLabel="Create account and continue"
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(24),
    marginTop: vs(4),
  },
  topAction: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 8,
  },
  topActionSpacer: {
    width: 72,
    height: 44,
  },
  topActionText: {
    marginLeft: 6,
    color: AppColors.blue,
    fontFamily: "Montserrat-Bold",
    fontSize: s(14),
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F5F7FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vs(24),
  },
  title: {
    color: AppColors.primary,
    fontFamily: "Montserrat-Bold",
    fontSize: s(30),
    lineHeight: s(36),
    textAlign: "center",
    marginBottom: vs(16),
  },
  body: {
    color: AppColors.primary,
    fontFamily: "Montserrat",
    fontSize: s(16),
    lineHeight: s(24),
    textAlign: "center",
    maxWidth: windowWidth - 64,
  },
  featureList: {
    width: "100%",
    marginTop: vs(28),
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    color: AppColors.primary,
    fontFamily: "Montserrat",
    fontSize: s(15),
    lineHeight: s(22),
  },
  footer: {
    paddingBottom: vs(16),
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: vs(20),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.grey2,
  },
  dotActive: {
    width: 24,
    backgroundColor: AppColors.blue,
  },
  primaryButton: {
    backgroundColor: AppColors.blue,
    minHeight: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: AppColors.white,
    fontFamily: "Montserrat-Bold",
    fontSize: s(15),
  },
  actionGroup: {
    gap: 12,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: AppColors.blue,
    backgroundColor: AppColors.white,
  },
  secondaryButtonText: {
    color: AppColors.blue,
    fontFamily: "Montserrat-Bold",
    fontSize: s(15),
  },
});
