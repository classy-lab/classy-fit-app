import { StyleSheet, Text, View } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import AuthStack from '../screens/auth/AuthStack'
import {
  DrawerContentScrollView,
  DrawerItemList,
  createDrawerNavigator,
} from '@react-navigation/drawer'
import About from '../screens/auth/About'
import Contact from '../screens/auth/Contact'
import GymHours from '../screens/auth/GymHours'
import { AppColors } from '../styles/colors'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import RegisterScreen from '../screens/auth/RegisterScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useFonts } from 'expo-font'
import DashboardScreen from '../screens/auth/DashboardScreen'
import RegisterComplete from '../screens/auth/RegisterComplete'

const Stack = createStackNavigator()

const MainAppStack = () => {
  const navigation = useNavigation()
  const Drawer = createDrawerNavigator();
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../assets/fonts/montserrat/Montserrat-Regular.ttf"),
  })

  function CustomDrawerContent(props) {
    return (
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <Ionicons name="close" size={28} color={AppColors.blue} style={{ marginLeft: 'auto' }} onPress={() => { navigation.dispatch(DrawerActions.closeDrawer()); }} />
          <Text style={styles.headerText}>Navigation</Text>
        </View>
        <DrawerItemList style={styles.drawerItemList} {...props} />
        {/* Add custom items or dividers here */}
      </DrawerContentScrollView>
    );
  }

  return (
    <>
      <Drawer.Navigator
        screenOptions={{
          // overlayColor: 'rgba(0, 0, 0, 0.3)',
          overlayColor: 'rgba(255, 255, 255, 0.3)',
          drawerStyle: {
            backgroundColor: AppColors.grey,
            width: 320,
            borderTopRightRadius: 40,     // Apply top-right border radius
            borderBottomRightRadius: 40,  // Apply bottom-right border radius
          },
          headerShown: false,
          drawerActiveTintColor: AppColors.blue,        // Active text/icon color
          drawerInactiveTintColor: AppColors.blue,      // Inactive text/icon color
          drawerActiveBackgroundColor: AppColors.grey,  // Active background color
          drawerItemStyle: { marginVertical: 4 },      // Apply a style to all items
          drawerLabelStyle: {
            fontSize: 20,
            fontFamily: 'Montserrat',
          },
        }} drawerContent={props => <CustomDrawerContent {...props} />}>
        <Drawer.Screen name="Home" component={AuthStack} />
        <Drawer.Screen name="About" component={About} options={{ title: 'About' }} />
        <Drawer.Screen name="Contact" component={Contact} options={{ title: 'Contact' }} />
        <Drawer.Screen name="GymHours" component={GymHours} options={{ title: 'Gym Hours' }} />

        <Drawer.Screen options={{
          drawerItemStyle: { display: 'none' },
        }} name='RegisterScreen' component={RegisterScreen} />
        <Drawer.Screen options={{
          drawerItemStyle: { display: 'none' },
        }} name='LoginScreen' component={LoginScreen} />
        <Drawer.Screen options={{
          drawerItemStyle: { display: 'none' },
        }} name='DashboardScreen' component={DashboardScreen} />
        <Drawer.Screen options={{
          drawerItemStyle: { display: 'none' },
        }} name='RegisterComplete' component={RegisterComplete} />
      </Drawer.Navigator>
    </>
  )
}

export default MainAppStack

const styles = StyleSheet.create({
  header: {
    marginTop: 8,
    marginBottom: 32,
  },
  headerText: {
    color: AppColors.blue,
    fontSize: 32,
    textAlign: 'center',
  },
  drawerItemList: {
    color: AppColors.blue,
  },
  overlay: {
    backgroundColor: 'red'
  }
});
