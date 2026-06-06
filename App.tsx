import { useState } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./src/navigation/AuthStack"; // Contains Login/Signup screens
import AppTabs from "./src/navigation/AppTabs"; // Contains Home/Dashboard/Settings screens
import { setCustomText } from "react-native-global-props";
import { UserContext } from "./src/context/UserContext";
import FlashMessage from "react-native-flash-message";

const customTextProps = {
  style: {
    fontFamily: "Montserrat-Regular",
  },
};
setCustomText(customTextProps);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tokens, setTokens] = useState(null);
  const [user, setUser] = useState(null);
  const [webServer, setWebserver] = useState(
    "http://localhost:8080/classy-api",
  );

  return (
    // The 'value' prop contains the data you want to share across children
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
      <NavigationContainer>
        {isLoggedIn ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>
      <FlashMessage position={"top"} />
    </UserContext.Provider>
  );
}

const styles = StyleSheet.create({});
