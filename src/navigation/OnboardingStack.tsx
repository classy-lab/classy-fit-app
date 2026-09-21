// @ts-nocheck
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import OnboardingScreen from "../screens/auth/OnboardingScreen";

const Stack = createStackNavigator();

const OnboardingStack = ({
  onComplete,
}: {
  onComplete: () => Promise<void> | void;
}) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingWelcome">
        {(props) => (
          <OnboardingScreen {...props} step="welcome" onComplete={onComplete} />
        )}
      </Stack.Screen>
      <Stack.Screen name="OnboardingFeatures">
        {(props) => (
          <OnboardingScreen {...props} step="features" onComplete={onComplete} />
        )}
      </Stack.Screen>
      <Stack.Screen name="OnboardingGetStarted">
        {(props) => (
          <OnboardingScreen
            {...props}
            step="getStarted"
            onComplete={onComplete}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default OnboardingStack;
