import { useEffect, useState } from "react";
import { StyleSheet, Linking } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StripeProvider } from "@stripe/stripe-react-native";
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
  const [stripePublishableKey, setStripePublishableKey] = useState(
    require("./app.json").expo.extra.stripePublishableKey || "pk_test_placeholder",
  );
  const [stripeAccountId, setStripeAccountId] = useState<string | undefined>();

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    // Register global default fonts after the family is available.
    setCustomText(customTextProps);
    setCustomTextInput(customTextInputProps);
  }, [fontsLoaded]);

  useEffect(() => {
    if (!user?.gym_id || !tokens?.access_token) {
      setStripeAccountId(undefined);
      return;
    }

    let isMounted = true;

    const fetchStripeAccountId = async () => {
      try {
        const response = await fetch(
          `${webServer}/api/v1/gyms/${user.gym_id}/stripe/accounts/status`,
          {
            headers: {
              Authorization: "Bearer " + tokens.access_token,
            },
          }
        );

        if (isMounted && response.status === 200) {
          const data = await response.json();
          const accountId = data?.account?.stripe_account_id;
          setStripeAccountId(accountId || undefined);
        } else if (isMounted) {
          setStripeAccountId(undefined);
        }
      } catch (error) {
        if (isMounted) {
          setStripeAccountId(undefined);
        }
      }
    };

    fetchStripeAccountId();

    return () => {
      isMounted = false;
    };
  }, [user?.gym_id, tokens?.access_token, webServer]);

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
        stripePublishableKey,
      }}
    >
      <StripeProvider
        publishableKey={stripePublishableKey}
        stripeAccountId={stripeAccountId}
        urlScheme="classyfit"
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
      </StripeProvider>
    </UserContext.Provider>
  );
}

const styles = StyleSheet.create({});
