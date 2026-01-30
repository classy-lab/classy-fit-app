import { StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import AntDesign from '@expo/vector-icons/AntDesign'
import Ionicons from '@expo/vector-icons/Ionicons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { AppColors } from '../styles/colors'

import GymScreen from './auth/GymScreen'
import StartScreen from './auth/StartScreen'
import StaffScreen from './auth/StaffScreen'
import Products from './auth/Products'
import ProfileScreen from './auth/ProfileScreen'

const Tab = createBottomTabNavigator()

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
    fontFamily: 'Montserrat',
    fontSize: 12,
  }
}

const TabNavigator = () => {
  const navigation = useNavigation()

  return (
    <Tab.Navigator style={{ flexGrow: 1 }} screenOptions={screenOptions} >
      <Tab.Screen
        options={{
          title: "Home",
          tabBarIcon: () => <AntDesign name="dashboard" size={24} color='black' onPress={() => { navigation.navigate('StartScreen') }} />
        }}
        name="Dashboard"
        component={StartScreen}
      />
      <Tab.Screen
        options={{
          title: "Gym",
          tabBarIcon: () => <FontAwesome5 name="dumbbell" size={20} color="black" onPress={() => { navigation.navigate('GymScreen') }} />
        }}
        name="Gym"
        component={GymScreen}
      />
      <Tab.Screen
        options={{
          title: "Staff",
          tabBarIcon: () => <FontAwesome6 name="bolt-lightning" size={20} color="black" onPress={() => { navigation.navigate('StaffScreen') }} />
        }}
        name="Staff"
        component={StaffScreen}
      />
      <Tab.Screen
        options={{
          title: "Products",
          tabBarIcon: () => <Ionicons name="bag-check-outline" size={24} color="black" onPress={() => { navigation.navigate('Products') }} />
        }}
        name="Products"
        component={Products}
      />
      <Tab.Screen
        options={{
          title: "Profile",
          tabBarIcon: () => <FontAwesome6 name="circle-user" size={24} color="black" onPress={() => { navigation.navigate('ProfileScreen') }} />
        }}
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  )
}

export default TabNavigator

const styles = StyleSheet.create({})