// @ts-nocheck
import { useContext } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AppColors } from "../../styles/colors";
import { useFonts } from "expo-font";
import VectorImageSvg from "../../components/svg/VectorImageSvg";
import { s, vs } from "react-native-size-matters";
import PhoneSvg from "../../components/svg/PhoneSvg";
import PinkLeafSvg from "../../assets/svg/PinkLeafSvg";
import PinkShape from "../../components/svg/PinkShape.tsx";
import { GymContext } from "../../context/GymContext";

const Contact = () => {
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingContainer}>
          {gymID ? (
            <Text style={styles.title}>{gymsInfo[gymID]?.Contact.title}</Text>
          ) : null}
          <PinkShape style={styles.pinkLeaf} />
        </View>

        <View style={styles.body}>
          {gymID ? (
            <Text style={styles.bodyText}>{gymsInfo[gymID]?.Contact.body}</Text>
          ) : null}
        </View>
      </ScrollView>
      <PhoneSvg style={styles.phoneSvg} />
      <View style={styles.imageContainer}>
        <VectorImageSvg />
      </View>
    </SafeAreaView>
  );
};

export default Contact;

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  scrollView: {
    flex: 1,
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
  },
  pinkLeaf: {
    position: "absolute",
    zIndex: -1,
    right: 16,
  },
  imageContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  body: { fontFamily: "Montserrat-Bold" },
  bodyText: {
    fontFamily: "Montserrat",
    fontSize: 16,
    lineHeight: 32,
    color: AppColors.primary,
    textAlign: "center",
  },
  phoneSvg: {
    alignSelf: "center",
    marginTop: 40,
  },
});
