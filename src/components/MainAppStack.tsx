import { StyleSheet, Text, View } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import AuthStack from '../screens/auth/AuthStack'
import RegisterScreen from '../screens/auth/RegisterScreen'
import LoginScreen from '../screens/auth/LoginScreen'

const Stack = createStackNavigator()

const MainAppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='AuthStack' component={AuthStack} />
      <Stack.Screen name='RegisterScreen' component={RegisterScreen} />
      <Stack.Screen name='LoginScreen' component={LoginScreen} />
    </Stack.Navigator>
  )
}

export default MainAppStack

const styles = StyleSheet.create({})