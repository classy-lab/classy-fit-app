// @ts-nocheck
import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  DrawerContentScrollView,
  DrawerItemList,
  createDrawerNavigator,
} from "@react-navigation/drawer";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { AppColors } from "../styles/colors";
import StartScreen from "../screens/auth/StartScreen";
import About from "../screens/auth/About";
import Contact from "../screens/auth/Contact";
import GymHours from "../screens/auth/GymHours";
import RegisterScreen from "../screens/auth/RegisterScreen";
import RegisterComplete from "../screens/auth/RegisterComplete";
import TemplateScreen from "../screens/auth/TemplateScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import ThankYouScreen from "../screens/app/ThankYouScreen";
import CreateGymScreen from "../screens/app/CreateGymScreen";
import { GymContext } from "../context/GymContext";
import { UserContext } from "../context/UserContext";

const screenOptionsStyle = {
  overlayColor: "rgba(255, 255, 255, 0.3)",
  drawerStyle: {
    backgroundColor: AppColors.grey,
    width: 320,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerShown: false,
  drawerActiveTintColor: AppColors.blue,
  drawerInactiveTintColor: AppColors.blue,
  drawerActiveBackgroundColor: AppColors.grey,
  drawerItemStyle: { marginVertical: 4 },
  drawerLabelStyle: {
    fontSize: 20,
  },
};

const buildContactBody = (gym: any) => {
  const lines = [
    gym?.address_line_1 || gym?.address1,
    gym?.address_line_2 || gym?.address2,
    [gym?.city, gym?.state, gym?.postal_code || gym?.zip].filter(Boolean).join(", "),
    gym?.country,
    gym?.email,
    gym?.phone,
    gym?.website_url,
  ].filter(Boolean);

  return lines.join("\n");
};

const formatGymHours = (gymHours: any) => {
  if (!gymHours) {
    return "";
  }

  if (typeof gymHours === "string") {
    return gymHours;
  }

  if (Array.isArray(gymHours)) {
    return gymHours
      .map((entry) => {
        if (entry && typeof entry === "object") {
          const day = entry.day || entry.name || "";
          const open = entry.open || entry.opens || "";
          const close = entry.close || entry.closes || "";
          const label = [day, open && close ? `${open} - ${close}` : open || close].filter(Boolean).join(" ");
          return label || JSON.stringify(entry);
        }

        return String(entry);
      })
      .join("\n");
  }

  if (typeof gymHours === "object") {
    return Object.entries(gymHours)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }

        if (value && typeof value === "object") {
          const open = value.open || value.opens || "";
          const close = value.close || value.closes || "";
          return `${key}: ${[open, close].filter(Boolean).join(" - ")}`;
        }

        return `${key}: ${String(value)}`;
      })
      .join("\n");
  }

  return String(gymHours);
};

const buildGymContextList = (gyms: any[]) => {
  const nextGymsInfo: any[] = [];

  gyms.forEach((gym) => {
    const gymId = Number(gym?.gym_id);
    if (!Number.isFinite(gymId) || gymId <= 0) {
      return;
    }

    nextGymsInfo[gymId] = {
      gym_id: gymId,
      gym_name: gym?.gym_name ?? "",
      city: gym?.city ?? "",
      About: {
        title: "About Us",
        body: (gym?.about ?? "").trim() || "About information is not available yet.",
      },
      Contact: {
        title: "Contact Us",
        body: buildContactBody(gym) || "Contact information is not available yet.",
      },
      GymHours: {
        title: "Gym Hours",
        body: formatGymHours(gym?.gym_hours) || "Gym hours are not available yet.",
      },
    };
  });

  return nextGymsInfo;
};

const AuthStack = () => {
  const navigation = useNavigation();
  const Drawer = createDrawerNavigator();
  const { webServer } = useContext(UserContext);
  const [gymID, setGymID] = useState(null);
  const [gymsInfo, setGymsInfo] = useState<any[]>([]);
  const [gymsLoading, setGymsLoading] = useState(true);
  const [gymsError, setGymsError] = useState("");
  const [navOpacity, setNavOpacity] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadGyms = async () => {
      setGymsLoading(true);
      setGymsError("");

      try {
        const response = await fetch(`${webServer}/api/v1/public/gyms`);
        const body = await response.json().catch(() => ({}));

        if (!isMounted) {
          return;
        }

        if (response.status !== 200) {
          setGymsInfo([]);
          setGymsError(body?.message || "Unable to load gyms.");
          return;
        }

        setGymsInfo(buildGymContextList(Array.isArray(body?.gyms) ? body.gyms : []));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setGymsInfo([]);
        setGymsError("Unable to load gyms.");
        console.error("Failed to load public gyms:", error);
      } finally {
        if (isMounted) {
          setGymsLoading(false);
        }
      }
    };

    loadGyms();

    return () => {
      isMounted = false;
    };
  }, [webServer]);

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
      </DrawerContentScrollView>
    );
  }

  return (
    <GymContext.Provider
      value={{
        gymsInfo,
        gymID,
        setGymID,
        navOpacity,
        setNavOpacity,
        gymsLoading,
        gymsError,
      }}
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
          name="CreateGymScreen"
          component={CreateGymScreen}
          options={{ drawerItemStyle: { display: "none" } }}
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
