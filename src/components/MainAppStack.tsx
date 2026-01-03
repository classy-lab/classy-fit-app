import { StyleSheet, Text, View } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import AuthStack from '../screens/auth/AuthStack'
import RegisterScreen from '../screens/auth/RegisterScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import { createDrawerNavigator } from '@react-navigation/drawer';
const Stack = createStackNavigator()

const MainAppStack = () => {

  const Drawer = createDrawerNavigator();

  return (
    <>
      <Drawer.Navigator screenOptions={{ headerShown: false }}>
        <Drawer.Screen name="AuthStack" component={AuthStack} />
        <Drawer.Screen name="RegisterScreen" component={RegisterScreen} />
        <Drawer.Screen name="LoginScreen" component={LoginScreen} />
      </Drawer.Navigator>

      {/* <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name='AuthStack' component={AuthStack} />
        <Stack.Screen name='RegisterScreen' component={RegisterScreen} />
        <Stack.Screen name='LoginScreen' component={LoginScreen} />
      </Stack.Navigator> */}
    </>

  )
}

export default MainAppStack

const styles = StyleSheet.create({})