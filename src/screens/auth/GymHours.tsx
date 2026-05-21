import { useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { AppColors } from "../../styles/colors";
import { useFonts } from "expo-font";
import Jogging from "../../components/svg/Jogging";
import PinkLeafSvg from "../../assets/svg/PinkLeafSvg";
import { GymContext } from "../../context/GymContext";

const GymHours = () => {
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
            <Text style={styles.title}>{gymsInfo[gymID]?.GymHours.title}</Text>
          ) : null}
          <PinkLeafSvg style={styles.pinkLeaf} />
          {/* <PinkShape style={styles.pinkLeaf} /> */}
        </View>

        <View style={styles.body}>
          {gymID ? (
            <Text style={styles.bodyText}>
              {gymsInfo[gymID]?.GymHours.body}
            </Text>
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.imageContainer}>
        <Jogging width="360" />
      </View>
    </SafeAreaView>
  );
};

export default GymHours;

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  scrollView: { flex: 1 },
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
  },
  pinkLeaf: {
    position: "relative",
    zIndex: -1,
    top: -68,
    right: -40,
  },
  body: {},
  bodyText: {
    fontFamily: "Montserrat",
    fontSize: 16,
    lineHeight: 32,
    color: AppColors.primary,
    marginLeft: 24,
    marginRight: 24,
    textAlign: "center",
  },
  imageContainer: {
    marginTop: 16,
    alignSelf: "center",
  },
  columnContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 40,
  },
  column: {},
  columnText: {
    fontSize: 16,
    lineHeight: 32,
  },
  callText: {
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 16,
    alignSelf: "center",
    textAlign: "center",
    marginTop: 32,
  },
});
