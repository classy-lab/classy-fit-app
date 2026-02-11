import { StyleSheet, Text, View } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import StartScreen from '../screens/auth/StartScreen'
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
import SignoutScreen from '../screens/auth/SignoutScreen'
import Earnings from '../screens/auth/Earnings'
import GymScreen from '../screens/auth/GymScreen'
import TemplateScreen from '../screens/auth/TemplateScreen'
import StaffScreen from '../screens/auth/StaffScreen'
import Members from '../screens/auth/Members'
import Products from '../screens/auth/Products'
import Contractors from '../screens/auth/Contractors'
import TotalCost from '../screens/auth/TotalCost'
import ThankYou from '../screens/auth/ThankYou'
import ProfileScreen from '../screens/auth/ProfileScreen'
import AddStaffScreen from '../screens/auth/AddStaffScreen'
import AddMemberScreen from '../screens/auth/AddMemberScreen'
import AddProductScreen from '../screens/auth/AddProductScreen'
import AddContactScreen from '../screens/auth/AddContactScreen'
import TabNavigator from '../screens/TabNavigator'

const Stack = createStackNavigator()

const screenOptionsStyle = {
  // overlayColor: 'rgba(0, 0, 0, 0.3)',
  overlayColor: 'rgba(255, 255, 255, 0.3)',
  drawerStyle: {
    backgroundColor: AppColors.grey,
    width: 320,
    borderTopRightRadius: 40,                   // Apply top-right border radius
    borderBottomRightRadius: 40,                // Apply bottom-right border radius
  },
  headerShown: false,
  drawerActiveTintColor: AppColors.blue,        // Active text/icon color
  drawerInactiveTintColor: AppColors.blue,      // Inactive text/icon color
  drawerActiveBackgroundColor: AppColors.grey,  // Active background color
  drawerItemStyle: { marginVertical: 4 },       // Apply a style to all items
  drawerLabelStyle: {
    fontSize: 20,
    fontFamily: 'Montserrat',
  },
}

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
      <Drawer.Navigator screenOptions={screenOptionsStyle} drawerContent={props => <CustomDrawerContent {...props} />}>
        {/* Tab navigator is a screen in the root stack */}
        <Drawer.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
        {/* Screens outside the tabs cover the whole screen, including hiding the tab bar */}
        <Drawer.Screen name="Home" component={StartScreen} />
        <Drawer.Screen name="About" component={About} options={{ title: 'About' }} />
        <Drawer.Screen name="Contact" component={Contact} options={{ title: 'Contact' }} />
        <Drawer.Screen name="GymHours" component={GymHours} options={{ title: 'Gym Hours' }} />
        <Drawer.Screen name='StartScreen' options={{ drawerItemStyle: { display: 'none' }, }} component={StartScreen} />
        <Drawer.Screen name='RegisterScreen' options={{ drawerItemStyle: { display: 'none' }, }} component={RegisterScreen} />
        <Drawer.Screen name='LoginScreen' options={{ drawerItemStyle: { display: 'none' }, }} component={LoginScreen} />
        <Drawer.Screen name='RegisterComplete' options={{ drawerItemStyle: { display: 'none' }, }} component={RegisterComplete} />
        <Drawer.Screen name='TemplateScreen' options={{}} component={TemplateScreen} />
        {/* <Drawer.Screen
          name='DashboardScreen'
          // options={{ drawerItemStyle: { display: 'none' }, }}
          component={DashboardScreen}
        /> */}

        {/* <Drawer.Screen
          name='Earnings'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={Earnings}
        /> */}
        {/* <Drawer.Screen
          name='GymScreen'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={GymScreen}
        />
        <Drawer.Screen
          name='StaffScreen'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={StaffScreen}
        />
        <Drawer.Screen
          name='Members'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={Members}
        /> */}
        {/* <Drawer.Screen
          name='Products'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={Products}
        />
        <Drawer.Screen
          name='Contractors'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={Contractors}
        />
        <Drawer.Screen
          name='TotalCost'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={TotalCost}
        /> */}
        {/* <Drawer.Screen
          name='ThankYou'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={ThankYou}
        />
        <Drawer.Screen
          name='SignoutScreen'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={SignoutScreen}
        />
        <Drawer.Screen
          name='ProfileScreen'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={ProfileScreen}
        />
        <Drawer.Screen
          name='AddStaffScreen'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={AddStaffScreen}
        /> */}
        {/* <Drawer.Screen
          name='AddMemberScreen'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={AddMemberScreen}
        />
        <Drawer.Screen
          name='AddProductScreen'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={AddProductScreen}
        />
        <Drawer.Screen
          name='AddContactScreen'
          options={{
            // drawerItemStyle: { display: 'none' },
          }}
          component={AddContactScreen}
        /> */}
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
