import React, { useState } from "react";
import { StyleSheet } from "react-native";
import FlashMessage from "react-native-flash-message";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./src/navigation/AuthStack"; // Contains Login/Signup screens
import AppTabs from "./src/navigation/AppTabs"; // Contains Home/Dashboard/Settings screens
import { setCustomText } from "react-native-global-props";
import { UserContext } from "./src/context/UserContext";

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

  return (
    // The 'value' prop contains the data you want to share across children
    <UserContext.Provider
      value={{ isLoggedIn, setIsLoggedIn, user, setUser, tokens, setTokens }}
    >
      <NavigationContainer>
        <FlashMessage position={"top"} />
        {isLoggedIn ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>
    </UserContext.Provider>
  );
}

const styles = StyleSheet.create({});
