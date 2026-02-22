// navigation/AppTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack';
import { AppColors } from '../styles/colors'
import Ionicons from '@expo/vector-icons/Ionicons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useNavigation } from '@react-navigation/native'

import DashboardScreen from '../screens/app/DashboardScreen'
import GymScreen from '../screens/app/GymScreen'
import StaffScreen from '../screens/app/StaffScreen'
import MembersScreen from '../screens/app/MembersScreen'
import ProductsScreen from '../screens/app/ProductsScreen'
import ProfileScreen from '../screens/app/ProfileScreen'
import EarningsScreen from '../screens/app/EarningsScreen'
import ContractorsScreen from '../screens/app/ContractorsScreen'
import SignoutScreen from '../screens/app/SignoutScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import ProductDetailScreen from '../screens/app/ProductDetailScreen'
import AddProductScreen from '../screens/app/AddProductScreen'
import ViewCartScreen from '../screens/app/ViewCartScreen'
import ThankYouScreen from '../screens/app/ThankYouScreen'
import TreadmillEquipmentScreen from '../screens/app/TreadmillEquipmentScreen'

const Tab = createBottomTabNavigator()
const HomeStack = createStackNavigator()
const ProductStack = createStackNavigator()
const GymStack = createStackNavigator()

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="DashboardScreen" component={DashboardScreen} />
      <HomeStack.Screen name="EarningsScreen" component={EarningsScreen} />
      <HomeStack.Screen name="StaffScreen" component={StaffScreen} />
      <HomeStack.Screen name="MembersScreen" component={MembersScreen} />
      <HomeStack.Screen name="ContractorsScreen" component={ContractorsScreen} />
      <HomeStack.Screen name="SignoutScreen" component={SignoutScreen} />
      <HomeStack.Screen name="LoginScreen" component={LoginScreen} />
    </HomeStack.Navigator>
  );
}

function ProductStackScreen() {
  return (
    <ProductStack.Navigator screenOptions={screenOptions}>
      <ProductStack.Screen name="ProductsScreen" component={ProductsScreen} />
      <ProductStack.Screen name="ProductDetailScreen" component={ProductDetailScreen} />
      <ProductStack.Screen name="AddProductScreen" component={AddProductScreen} />
      <ProductStack.Screen name="ViewCartScreen" component={ViewCartScreen} />
      <ProductStack.Screen name="ThankYouScreen" component={ThankYouScreen} />
    </ProductStack.Navigator>
  )
}

function GymStackScreen() {
  return (
    <GymStack.Navigator screenOptions={screenOptions}>
      <GymStack.Screen name="GymScreen" component={GymScreen} />
      <GymStack.Screen name="TreadmillEquipmentScreen" component={TreadmillEquipmentScreen} />
    </GymStack.Navigator>
  )
}

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
  },
  tabBarLabelStyle: {
    fontSize: 12,
  }
}

const AppTabs = () => {
  const navigation = useNavigation()

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      {/* Clicking this tab shows the HomeStack, with the tab bar still at the bottom */}
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          // Customize the tab label and icon here
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="GymTab"
        component={GymStackScreen}
        options={{
          title: "Gym",
          tabBarIcon: () => <FontAwesome5 name="dumbbell" size={20} color="black" />
        }}
      />
      <Tab.Screen
        name="StaffScreen"
        component={StaffScreen}
        options={{
          title: "Staff",
          tabBarIcon: () => <FontAwesome6 name="bolt-lightning" size={20} color="black" onPress={() => { navigation.navigate('StaffScreen') }} />
        }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductStackScreen}
        options={{
          title: "Products",
          tabBarIcon: () => <Ionicons name="bag-check-outline" size={24} color="black" />
        }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: () => <FontAwesome6 name="circle-user" size={24} color="black" onPress={() => { navigation.navigate('ProfileScreen') }} />
        }}
      />
    </Tab.Navigator>
  )
}

export default AppTabs;
