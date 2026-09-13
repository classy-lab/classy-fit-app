// @ts-nocheck
// navigation/AppTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack';
import { AppColors } from '../styles/colors'
import Ionicons from '@expo/vector-icons/Ionicons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'

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
import EditProductScreen from '../screens/app/EditProductScreen'
import ViewCartScreen from '../screens/app/ViewCartScreen'
import ThankYouScreen from '../screens/app/ThankYouScreen'
import ClassesScreen from '../screens/app/ClassesScreen'
import ClassSessionScreen from '../screens/app/ClassSessionScreen'
import ClassBookingSuccessScreen from '../screens/app/ClassBookingSuccessScreen'
import TreadmillEquipmentScreen from '../screens/app/TreadmillEquipmentScreen'
import GymEquipmentScreen from '../screens/app/GymEquipmentScreen'
import EquipmentDetailScreen from '../screens/app/EquipmentDetailScreen'
import AllEarnings from '../screens/app/AllEarnings'
import AddStaffScreen from '../screens/app/AddStaffScreen'
import AddContactScreen from '../screens/app/AddContactScreen'
import UpdateContactScreen from '../screens/app/UpdateContactScreen'
import UpdateStaffScreen from '../screens/app/UpdateStaffScreen'
import UpdateMemberScreen from '../screens/app/UpdateMemberScreen'
import AddMemberScreen from '../screens/app/AddMemberScreen'
import AddEquipmentScreen from '../screens/app/AddEquipmentScreen'
import EquipmentEditScreen from '../screens/app/EquipmentEditScreen'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

const Tab = createBottomTabNavigator()
const HomeStack = createStackNavigator()
const ProductStack = createStackNavigator()
const ClassesStack = createStackNavigator()
const StaffStack = createStackNavigator()
const GymStack = createStackNavigator()

function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={{ ...screenOptions, animationEnabled: false }}
    >
      <HomeStack.Screen name="DashboardScreen" component={DashboardScreen} />
      <HomeStack.Screen name="EarningsScreen" component={EarningsScreen} />
      <HomeStack.Screen name="GymScreen" component={GymScreen} />
      <HomeStack.Screen name="StaffScreen" component={StaffScreen} />
      <HomeStack.Screen name="MembersScreen" component={MembersScreen} />
      <HomeStack.Screen name="ProductsScreen" component={ProductsScreen} />
      <HomeStack.Screen name="ContractorsScreen" component={ContractorsScreen} />
      <HomeStack.Screen name="SignoutScreen" component={SignoutScreen} />
      <HomeStack.Screen name="LoginScreen" component={LoginScreen} />
      <HomeStack.Screen name="AllEarnings" component={AllEarnings} />
      <HomeStack.Screen name="UpdateStaffScreen" component={UpdateStaffScreen} />
      <HomeStack.Screen name="UpdateMemberScreen" component={UpdateMemberScreen} />
      <HomeStack.Screen name="AddMemberScreen" component={AddMemberScreen} />
    </HomeStack.Navigator>
  );
}

function GymStackScreen() {
  return (
    <GymStack.Navigator screenOptions={screenOptions}>
      <GymStack.Screen name="GymScreen" component={GymScreen} />
      <GymStack.Screen name="GymEquipmentScreen" component={GymEquipmentScreen} />
      <GymStack.Screen name="EquipmentDetailScreen" component={EquipmentDetailScreen} />
      <GymStack.Screen name="TreadmillEquipmentScreen" component={TreadmillEquipmentScreen} />
      <GymStack.Screen name="AddEquipmentScreen" component={AddEquipmentScreen} />
      <GymStack.Screen name="EquipmentEditScreen" component={EquipmentEditScreen} />
    </GymStack.Navigator>
  )
}

function StaffStackScreen() {
  return (
    <StaffStack.Navigator screenOptions={screenOptions}>
      <StaffStack.Screen name="StaffScreen" component={StaffScreen} />
      <StaffStack.Screen name="AddStaffScreen" component={AddStaffScreen} />
      <StaffStack.Screen name="AddContactScreen" component={AddContactScreen} />
      <StaffStack.Screen name="UpdateContactScreen" component={UpdateContactScreen} />
      <StaffStack.Screen name="UpdateStaffScreen" component={UpdateStaffScreen} />
      <StaffStack.Screen name="UpdateMemberScreen" component={UpdateMemberScreen} />
    </StaffStack.Navigator>
  )
}

function ProductStackScreen() {
  return (
    <ProductStack.Navigator screenOptions={screenOptions}>
      <ProductStack.Screen name="ProductsScreen" component={ProductsScreen} />
      <ProductStack.Screen name="ProductDetailScreen" component={ProductDetailScreen} />
      <ProductStack.Screen name="AddProductScreen" component={AddProductScreen} />
      <ProductStack.Screen name="EditProductScreen" component={EditProductScreen} />
      <ProductStack.Screen name="ViewCartScreen" component={ViewCartScreen} />
      <ProductStack.Screen name="ThankYouScreen" component={ThankYouScreen} />
    </ProductStack.Navigator>
  )
}

function ClassesStackScreen() {
  return (
    <ClassesStack.Navigator screenOptions={screenOptions}>
      <ClassesStack.Screen name="ClassesScreen" component={ClassesScreen} />
      <ClassesStack.Screen name="ClassSessionScreen" component={ClassSessionScreen} />
      <ClassesStack.Screen name="ClassBookingSuccessScreen" component={ClassBookingSuccessScreen} />
    </ClassesStack.Navigator>
  )
}


const screenOptions = {
  tabBarActiveTintColor: AppColors.blue,
  tabBarInactiveTintColor: AppColors.primary,
  tabBarLabelPosition: 'below-icon',
  headerShown: false,
  animation: 'none',
  tabBarStyle: {
    backgroundColor: AppColors.white, // Tab bar background color
    elevation: 0,                     // for Android
    // shadowOpacity: 0,              // for iOS
    // borderTopWidth: 1,             // for iOS // Add top border
    // borderTopLeftRadius: 24,       // Apply top left radius
    // borderTopRightRadius: 24,      // Apply top right radius
    // borderTopColor: AppColors.grey2,// Border color
    // overflow: 'hidden',            // Hide overflow to make radius work properly
  },
  tabBarLabelStyle: {
    fontSize: 12,
  }
}

const createRootTabListener = (tabName, screenName) => ({ navigation }) => ({
  tabPress: (e) => {
    e.preventDefault();
    navigation.navigate(tabName, { screen: screenName });
  },
});

const AppTabs = () => {
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
            <Ionicons name="home" color={color} size={20} />
          ),
        }}
        listeners={createRootTabListener('HomeTab', 'DashboardScreen')}
      />
      <Tab.Screen
        name="GymTab"
        component={GymStackScreen}
        options={{
          title: "Gym",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="dumbbell" size={19} color={color} />
          ),
        }}
        listeners={createRootTabListener('GymTab', 'GymScreen')}
      />
      <Tab.Screen
        name="StaffTab"
        component={StaffStackScreen}
        options={{
          title: "Staff",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="bolt-lightning" size={19} color={color} />
            // <FontAwesome5 name="user-friends" size={20} color={color} />
          ),
        }}
        listeners={createRootTabListener('StaffTab', 'StaffScreen')}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductStackScreen}
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-handle" size={20} color={color} />
        }}
        listeners={createRootTabListener('ProductsTab', 'ProductsScreen')}
      />
      <Tab.Screen
        name="ClassesTab"
        component={ClassesStackScreen}
        options={{
          title: "Classes",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar-month" size={20} color={color} />
        }}
        listeners={createRootTabListener('ClassesTab', 'ClassesScreen')}
      />
      {/* <Tab.Screen
        name="CartTab"
        component={ViewCartScreen}
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={20} color={color} />
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ProductsTab', { screen: 'ViewCartScreen' });
          },
        })}
      /> */}
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <FontAwesome6 name="circle-user" size={20} color={color} />
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ProfileScreen');
          },
        })}
      />
    </Tab.Navigator>
  )
}

export default AppTabs
