import React from 'react';
import { StyleSheet, Text, View } from 'react-native'
import { AppColors } from '../styles/colors'
import Ionicons from '@expo/vector-icons/Ionicons'
import { DrawerContentScrollView, DrawerItemList, createDrawerNavigator } from '@react-navigation/drawer'
import { DrawerActions, useNavigation } from '@react-navigation/native'

import StartScreen from '../screens/auth/StartScreen'
import About from '../screens/auth/About'
import Contact from '../screens/auth/Contact'
import GymHours from '../screens/auth/GymHours'
import RegisterScreen from '../screens/auth/RegisterScreen'
import RegisterComplete from '../screens/auth/RegisterComplete'
import TemplateScreen from '../screens/auth/TemplateScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import TreadmillEquipmentScreen from '../screens/app/TreadmillEquipmentScreen'

const screenOptionsStyle = {
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
  },
}

const AuthStack = () => {
  const navigation = useNavigation()
  const Drawer = createDrawerNavigator();

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
    <Drawer.Navigator
      screenOptions={screenOptionsStyle}
      drawerContent={props => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Home" component={StartScreen} />
      <Drawer.Screen name="About" component={About} options={{ title: 'About' }} />
      <Drawer.Screen name="Contact" component={Contact} options={{ title: 'Contact' }} />
      <Drawer.Screen name="GymHours" component={GymHours} options={{ title: 'Gym Hours' }} />
      <Drawer.Screen name='StartScreen' component={StartScreen} />
      <Drawer.Screen name='RegisterScreen' component={RegisterScreen} />
      <Drawer.Screen name='LoginScreen' component={LoginScreen} />
      <Drawer.Screen name='RegisterComplete' component={RegisterComplete} />
      <Drawer.Screen name='TemplateScreen' options={{}} component={TemplateScreen} />
      <Drawer.Screen name='TreadmillEquipmentScreen' options={{}} component={TreadmillEquipmentScreen} />
      {/* <Drawer.Screen name='RegisterComplete' options={{ drawerItemStyle: { display: 'none' }, }} component={RegisterComplete} /> */}
    </Drawer.Navigator>
  );
};

export default AuthStack

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
})
