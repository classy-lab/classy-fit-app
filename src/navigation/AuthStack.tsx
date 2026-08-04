// @ts-nocheck
import React, { useState, useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppColors } from "../styles/colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  DrawerContentScrollView,
  DrawerItemList,
  createDrawerNavigator,
} from "@react-navigation/drawer";
import { DrawerActions, useNavigation } from "@react-navigation/native";

import StartScreen from "../screens/auth/StartScreen";
import About from "../screens/auth/About";
import Contact from "../screens/auth/Contact";
import GymHours from "../screens/auth/GymHours";
import RegisterScreen from "../screens/auth/RegisterScreen";
import RegisterComplete from "../screens/auth/RegisterComplete";
import TemplateScreen from "../screens/auth/TemplateScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import ThankYouScreen from "../screens/app/ThankYouScreen";
import { GymContext } from "../context/GymContext";

const screenOptionsStyle = {
  overlayColor: "rgba(255, 255, 255, 0.3)",
  drawerStyle: {
    backgroundColor: AppColors.grey,
    width: 320,
    borderTopRightRadius: 40, // Apply top-right border radius
    borderBottomRightRadius: 40, // Apply bottom-right border radius
  },
  headerShown: false,
  drawerActiveTintColor: AppColors.blue, // Active text/icon color
  drawerInactiveTintColor: AppColors.blue, // Inactive text/icon color
  drawerActiveBackgroundColor: AppColors.grey, // Active background color
  drawerItemStyle: { marginVertical: 4 }, // Apply a style to all items
  drawerLabelStyle: {
    fontSize: 20,
  },
};

const AuthStack = () => {
  const navigation = useNavigation();
  const Drawer = createDrawerNavigator();
  const gyms = [
    {},
    {
      About: {
        title: "About Us",
        body: `At Classy Fitness, Our facility offers plenty of room to move, clean and well-maintained equipment, and a supportive community to help you achieve your fitness goals.\n\n Get started today and experience the difference at Classy Fitness!`,
      },
      Contact: {
        title: "Contact Us",
        body: `Your journey to a better you starts here at Classy Fitness! \n\n Address: \n 3143 US Route 9  \n Suite #4 \n Valatie, NY 12184 \n info@classyfitnessny.com \n\n Phone: \n (518) 610-8009`,
      },
      GymHours: {
        title: "Gym Hours",
        body: `Weekdays\n 5:30am - 9:00pm\n\n Saturday\n 7:00am - 7:00pm\n\n Sunday\n 8:00am - 5:00pm`,
      },
    },
    {
      About: {
        title: "About Us",
        body: `Welcome to VENT.\n\nVENT Fitness is the Capital District's premier, locally-owned full-service health club with equipment, classes, programs and amenities for every stage of your reinVENTion. With four full-service health clubs, VENT Fitness offers a welcoming fitness environment for everyone. Wherever you are on your fitness journey — a beginner or long-time enthusiast — our team of professional, fun and approachable staff are here to help you every step of the way.`,
      },
      Contact: {
        title: "Contact Us",
        body: `VENT Clifton Park \n\nAddress: \n 1220 Route 146  \nClifton Park, NY 12065 \nventcliftonpark@ventfitness.com \n\nPhone: \n (518) 348-1500`,
      },
      GymHours: {
        title: "Gym Hours",
        body: `Monday - Thursday\n5:00am - 10:00pm\n\nFriday\n5:00am - 9:00pm\n\nSaturday - Sunday\n7:00am - 7:00pm`,
      },
    },
    {
      About: {
        title: "About Us",
        body: `The Bodyshop GYM is A FITNESS FAMILY, WITH SOMETHING FOR EVERYONE!\nAt ABC Sports and Fitness for one low monthly price you can get absolutely everything you need to reach your fitness goals all in one place! Stop by the all new ABC Sports and Fitness today and see why we are the premier gym in the capital district!`,
      },
      Contact: {
        title: "Contact Us",
        body: `Address:\n3 Johnson Rd\nLatham, NY 12110\n\nPhone:\n(518) 783-0705`,
      },
      GymHours: {
        title: "Gym Hours",
        body: `Flexible Schedule\n\nWeekdays Hours\n Opens Monday at 5:00am\n 24 Hours through Thursday\nCloses Friday at 11:00pm\n\nWeekend Hours\nSaturday - 7:00am to 7:00pm\nSunday - 7:00am to 7:00pm\n\nPlease check our Google listing for any special hours on holidays.`,
      },
    },
    {
      About: {
        title: "About Us",
        body: `At Sarah's Gym in Cobleskill, Our facility offers plenty of room to move, clean and well-maintained equipment, and a supportive community to help you achieve your fitness goals.\n\n Get started today and experience the difference at Classy Fitness!`,
      },
      Contact: {
        title: "Contact Us",
        body: `Your journey to a better you starts here at Sarah's Gym! \n\n Address: \n 3143 US Route 7  \n Suite #4 \n Cobleskill, NY 12184 \n info@sarahsgym.com \n\n Phone: \n (518) 610-8009`,
      },
      GymHours: {
        title: "Gym Hours",
        body: `Weekdays\n 5:30am - 9:00pm\n\n Saturday\n 7:00am - 7:00pm\n\n Sunday\n 8:00am - 5:00pm`,
      },
    },
  ];
  const [gymID, setGymID] = useState(null);
  const [gymsInfo, setGymsInfo] = useState(gyms);
  const [navOpacity, setNavOpacity] = useState(0);
  // console.log(gymsInfo[0].About);

  function CustomDrawerContent(props) {
    return (
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <Ionicons
            name="close"
            size={28}
            color={AppColors.blue}
            style={{ marginLeft: "auto" }}
            onPress={() => {
              navigation.dispatch(DrawerActions.closeDrawer());
            }}
          />
          <Text style={styles.headerText}>Navigation</Text>
        </View>
        <DrawerItemList style={styles.drawerItemList} {...props} />
        {/* Add custom items or dividers here */}
      </DrawerContentScrollView>
    );
  }

  return (
    <GymContext.Provider
      value={{ gymsInfo, gymID, setGymID, navOpacity, setNavOpacity }}
    >
      <Drawer.Navigator
        screenOptions={screenOptionsStyle}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen name="Home" component={StartScreen} />
        <Drawer.Screen
          name="About"
          component={About}
          options={{ title: "About" }}
        />
        <Drawer.Screen
          name="Contact"
          component={Contact}
          options={{ title: "Contact" }}
        />
        <Drawer.Screen
          name="GymHours"
          component={GymHours}
          options={{ title: "Gym Hours" }}
        />

        <Drawer.Screen
          name="StartScreen"
          options={{ drawerItemStyle: { display: "none" } }}
          component={StartScreen}
        />
        <Drawer.Screen
          name="RegisterScreen"
          options={{ drawerItemStyle: { display: "none" } }}
          component={RegisterScreen}
        />
        <Drawer.Screen
          name="LoginScreen"
          options={{ drawerItemStyle: { display: "none" } }}
          component={LoginScreen}
        />
        <Drawer.Screen
          name="RegisterComplete"
          options={{ drawerItemStyle: { display: "none" } }}
          component={RegisterComplete}
        />
        <Drawer.Screen
          name="TemplateScreen"
          options={{ drawerItemStyle: { display: "none" } }}
          component={TemplateScreen}
        />
        <Drawer.Screen
          name="ThankYouScreen"
          options={{ drawerItemStyle: { display: "none" } }}
          component={ThankYouScreen}
        />
        {/* <Drawer.Screen
        name="ThankYouScreen"
        options={{ drawerItemStyle: { display: "none" } }}
        component={ThankYouScreen}
      /> */}
      </Drawer.Navigator>
    </GymContext.Provider>
  );
};

export default AuthStack;

const styles = StyleSheet.create({
  header: {
    marginTop: 8,
    marginBottom: 32,
  },
  headerText: {
    color: AppColors.blue,
    fontSize: 32,
    textAlign: "center",
  },
  drawerItemList: {
    color: AppColors.blue,
  },
  overlay: {
    backgroundColor: "red",
  },
});
