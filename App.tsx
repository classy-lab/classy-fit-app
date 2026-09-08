import { useEffect, useState } from "react";
import { StyleSheet, Linking } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./src/navigation/AuthStack"; // Contains Login/Signup screens
import AppTabs from "./src/navigation/AppTabs"; // Contains Home/Dashboard/Settings screens
import { useFonts } from "expo-font";
import { setCustomText, setCustomTextInput } from "react-native-global-props";
import { UserContext } from "./src/context/UserContext";
import { CartProvider } from "./src/context/CartContext";
import FlashMessage from "react-native-flash-message";

// Apply Montserrat to Text components that do not set a font explicitly.
const customTextProps = {
  style: {
    fontFamily: "Montserrat",
  },
};

// Apply the same default font to TextInput components.
const customTextInputProps = {
  style: {
    fontFamily: "Montserrat",
  },
};

// Deep linking configuration for Stripe Connect onboarding return
const linking: any = {
  prefixes: ["classyfit://"],
  config: {
    screens: {
      HomeTab: {
        screens: {
          DashboardScreen: "stripe-onboarding-complete",
        },
      },
    },
  },
};

export default function App() {
  // Load fonts once at app startup before mounting navigators.
  const [fontsLoaded] = useFonts({
    Montserrat: require("./src/assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("./src/assets/fonts/montserrat/Montserrat-Bold.ttf"),
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tokens, setTokens] = useState(null);
  const [user, setUser] = useState(null);
  const [webServer, setWebserver] = useState(
    "http://localhost:8080/classy-api",
  );

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    // Register global default fonts after the family is available.
    setCustomText(customTextProps);
    setCustomTextInput(customTextInputProps);
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    // Share auth and API state across the app tree.
    <UserContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        user,
        setUser,
        tokens,
        setTokens,
        webServer,
      }}
    >
      <CartProvider>
        <NavigationContainer
          linking={linking}
          fallback={<></>}
        >
          {isLoggedIn ? <AppTabs /> : <AuthStack />}
        </NavigationContainer>
        <FlashMessage position={"top"} />
      </CartProvider>
    </UserContext.Provider>
  );
}

const styles = StyleSheet.create({});
