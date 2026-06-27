// @ts-nocheck
import React, { useContext } from "react";
import { StyleSheet, Text, View, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AppColors } from "../../styles/colors";
import { useFonts } from "expo-font";
import WorkoutSvg from "../../components/svg/WorkoutSvg";
import PinkLeafSvg from "../../assets/svg/PinkLeafSvg";
import { GymContext } from "../../context/GymContext";

const About = () => {
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    Montserrat: require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf"),
  });

  // GymContext variables
  const { gymID, setGymID } = useContext(GymContext);
  const { gymsInfo } = useContext(GymContext);
  // console.log(gymsInfo[gymID]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Feather
          name="arrow-left"
          color={AppColors.blue}
          size={36}
          onPress={() => {
            navigation.goBack();
          }}
        />
        <Ionicons
          color={AppColors.hamburgerIconColor}
          name="menu"
          size={40}
          onPress={() => navigation.openDrawer()}
        />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headingContainer}>
          {gymID ? (
            <Text style={styles.title}>{gymsInfo[gymID]?.About.title}</Text>
          ) : null}
        </View>

        <View style={styles.body}>
          {gymID ? (
            <Text style={styles.bodyText}>{gymsInfo[gymID]?.About.body}</Text>
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.imageContainer}>
        <WorkoutSvg />
      </View>
    </SafeAreaView>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  navs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headingContainer: {
    alignItems: "center",
  },
  title: {
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 32,
    marginTop: 60,
    marginBottom: 40,
    width: 320,
    textAlign: "center",
  },
  pinkLeaf: {
    position: "relative",
    zIndex: -1,
    top: -68,
    right: -40,
  },
  body: {
    flex: 1,
  },
  bodyText: {
    fontSize: 16,
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
});
