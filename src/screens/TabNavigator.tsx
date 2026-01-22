import { StyleSheet, Text, View } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import AntDesign from '@expo/vector-icons/AntDesign'
import Ionicons from '@expo/vector-icons/Ionicons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { AppColors } from '../styles/colors'

import GymHours from './auth/GymHours'
import StartScreen from './auth/StartScreen'
import About from './auth/About'

const Tab = createBottomTabNavigator();

const screenOptions = {
  tabBarActiveTintColor: AppColors.blue,
  tabBarInactiveTintColor: AppColors.primary,
  tabBarLabelPosition: 'below-icon',
  tabBarStyle: {
    backgroundColor: AppColors.white, // Tab bar background color
    elevation: 0,                     // for Android
    // shadowOpacity: 0,                 // for iOS
    // borderTopWidth: 1,                // for iOS // Add top border
    // borderTopLeftRadius: 24,       // Apply top left radius
    // borderTopRightRadius: 24,      // Apply top right radius
    // borderTopColor: AppColors.grey,   // Border color
    // overflow: 'hidden',            // Hide overflow to make radius work properly
    height: 88,                       // Adjust height as needed
    bottom: 96,
    // borderWidth: 1, borderColor: 'red',
  },
  tabBarLabelStyle: {
    fontSize: 14,
  }
}

const TabNavigator = () => {
  return (
    <Tab.Navigator style={{ flexGrow: 1 }} screenOptions={screenOptions} >
      <Tab.Screen
        options={{
          title: "Home",
          tabBarIcon: () => <AntDesign name="dashboard" size={24} color='black' />
        }}
        name="Dashboard"
        component={StartScreen}
      />
      <Tab.Screen
        options={{
          title: "Gym",
          tabBarIcon: () => <FontAwesome5 name="dumbbell" size={20} color="black" />
        }}
        name="Gym"
        component={GymHours}
      />
      <Tab.Screen
        options={{
          title: "Staff",
          tabBarIcon: () => <FontAwesome6 name="bolt-lightning" size={20} color="black" />
        }}
        name="Staff"
        component={About}
      />
      <Tab.Screen
        options={{
          title: "Products",
          tabBarIcon: () => <Ionicons name="bag-check-outline" size={24} color="black" />
        }}
        name="Products"
        component={About}
      />
      <Tab.Screen
        options={{
          title: "Profile",
          tabBarIcon: () => <FontAwesome6 name="circle-user" size={24} color="black" />
        }}
        name="Profile"
        component={About}
      />
    </Tab.Navigator>
  )
}

export default TabNavigator

const styles = StyleSheet.create({})