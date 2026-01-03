import { StyleSheet, Text, View } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import AuthStack from '../screens/auth/AuthStack'
import {
  DrawerContentScrollView,
  DrawerItem,
  createDrawerNavigator,
} from '@react-navigation/drawer';
import About from '../screens/auth/About'
import Contact from '../screens/auth/Contact'
import GymHours from '../screens/auth/GymHours'
import { AppColors } from '../styles/colors'
// import { getHeaderTitle } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native'
import RegisterScreen from '../screens/auth/RegisterScreen'
import LoginScreen from '../screens/auth/LoginScreen'

// const Stack = createStackNavigator()

const MainAppStack = () => {
  const navigation = useNavigation()
  const Drawer = createDrawerNavigator();

  return (
    <>
      <Drawer.Navigator screenOptions={{ headerShown: false }}
        drawerContent={() => {
          return (
            <DrawerContentScrollView>
              <Text style={{ textAlign: 'center', fontSize: 32, color: AppColors.blue }}>Navigation</Text>
              <DrawerItem label={'Home'} onPress={() => { navigation.navigate('AuthStack') }} />
              <DrawerItem label={'About'} onPress={() => { navigation.navigate('About') }} />
              <DrawerItem label={'Contact'} onPress={() => { navigation.navigate('Contact') }} />
              <DrawerItem label={'Gym Hours'} onPress={() => { navigation.navigate('GymHours') }} />
            </DrawerContentScrollView>
          );
        }}>
        <Drawer.Screen name="AuthStack" component={AuthStack} />
        <Drawer.Screen name="About" component={About} options={{ title: 'About' }} />
        <Drawer.Screen name="Contact" component={Contact} options={{ title: 'Contact' }} />
        <Drawer.Screen name="GymHours" component={GymHours} options={{ title: 'Gym Hours' }} />
        <Drawer.Screen name='RegisterScreen' component={RegisterScreen} />
        <Drawer.Screen name='LoginScreen' component={LoginScreen} />
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