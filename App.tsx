import React, { useState, useEffect, createContext, useContext } from 'react';
import { StyleSheet } from 'react-native'
import FlashMessage from 'react-native-flash-message'
import { NavigationContainer } from '@react-navigation/native'
import AuthStack from './src/navigation/AuthStack'; // Contains Login/Signup screens
import AppTabs from './src/navigation/AppTabs';     // Contains Home/Dashboard/Settings screens
import { setCustomText } from 'react-native-global-props';

const customTextProps = {
  style: {
    fontFamily: 'Montserrat-Regular',
  }
}
setCustomText(customTextProps)

export default function App() {
  // 1. Initialize the context
  const LoginContext = createContext();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Check user login status

  return (
    <>
    {/* 2. Wrap Navigator in Provider */}
    <LoginContext.Provider value={{isLoggedIn, setIsLoggedIn}}>
      <NavigationContainer>
        <FlashMessage position={'top'} />
        {isLoggedIn ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>
    </LoginContext.Provider>
    </>
  )
}

const styles = StyleSheet.create({});
