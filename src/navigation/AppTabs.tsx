// navigation/AppTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { AppColors } from '../styles/colors'
import Ionicons from '@expo/vector-icons/Ionicons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useNavigation } from '@react-navigation/native'
import DashboardScreen from '../screens/app/DashboardScreen'
import GymScreen from '../screens/app/GymScreen'
import StaffScreen from '../screens/app/StaffScreen'
import Products from '../screens/app/Products'
import ProfileScreen from '../screens/app/ProfileScreen'

const Tab = createBottomTabNavigator()

const screenOptions = {
  tabBarActiveTintColor: AppColors.blue,
  tabBarInactiveTintColor: AppColors.primary,
  tabBarLabelPosition: 'below-icon',
  headerShown: false,
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
  const navigation = useNavigation()

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
      <Tab.Screen
        name="Gym"
        component={GymScreen}
        options={{
          title: "Gym",
          tabBarIcon: () => <FontAwesome5 name="dumbbell" size={20} color="black" onPress={() => { navigation.navigate('GymScreen') }} />
        }}
      />
      <Tab.Screen
        name="Staff"
        component={StaffScreen}
        options={{
          title: "Staff",
          tabBarIcon: () => <FontAwesome6 name="bolt-lightning" size={20} color="black" onPress={() => { navigation.navigate('StaffScreen') }} />
        }}
      />
      <Tab.Screen
        name="Products"
        component={Products}
        options={{
          title: "Products",
          tabBarIcon: () => <Ionicons name="bag-check-outline" size={24} color="black" onPress={() => { navigation.navigate('Products') }} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: () => <FontAwesome6 name="circle-user" size={24} color="black" onPress={() => { navigation.navigate('ProfileScreen') }} />
        }}
      />
    </Tab.Navigator>
  );
};

export default AppTabs;
