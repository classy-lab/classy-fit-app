// navigation/AppTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import DashboardScreen from '../screens/auth/DashboardScreen'
import { AppColors } from '../styles/colors'
import EarningsScreen from '../screens/auth/EarningsScreen'
import GymScreen from '../screens/auth/GymScreen'
import Ionicons from '@expo/vector-icons/Ionicons'

const Tab = createBottomTabNavigator()

const screenOptions = {
  tabBarActiveTintColor: AppColors.blue,
  tabBarInactiveTintColor: AppColors.primary,
  tabBarLabelPosition: 'below-icon',
  tabBarStyle: {
    backgroundColor: AppColors.white, // Tab bar background color
    elevation: 0,                     // for Android
    // shadowOpacity: 0,              // for iOS
    // borderTopWidth: 1,             // for iOS // Add top border
    // borderTopLeftRadius: 24,       // Apply top left radius
    // borderTopRightRadius: 24,      // Apply top right radius
    // borderTopColor: AppColors.grey,// Border color
    // overflow: 'hidden',            // Hide overflow to make radius work properly
    // height: 88,                    // Adjust height as needed
    // bottom: 96,
    // borderWidth: 1, borderColor: 'red',
  },
  tabBarLabelStyle: {
    fontFamily: 'Montserrat',
    fontSize: 12,
  }
}

const AppTabs = () => {
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="DashboardScreen" component={DashboardScreen}
        options={{
          // Customize the tab label and icon here
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="GymScreen" component={GymScreen} />
    </Tab.Navigator>
  );
};

export default AppTabs;
