import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native'
import FlashMessage from 'react-native-flash-message'
import { NavigationContainer } from '@react-navigation/native'
import AuthStack from './src/navigation/AuthStack'; // Contains Login/Signup screens
import AppTabs from './src/navigation/AppTabs';     // Contains Home/Dashboard/Settings screens

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Check user login status

  return (
    <>
      <NavigationContainer>
        <FlashMessage position={'top'} />
        {isLoggedIn ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>
    </>
  )
}

const styles = StyleSheet.create({});
