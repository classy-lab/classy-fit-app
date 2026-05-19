import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../../styles/colors";
import { useFonts } from "expo-font";
import Feather from "@expo/vector-icons/Feather";
import HealthyLifestyleSvg from "../../components/svg/HealthyLifestyleSvg";
import PinkLeafSvg from "../../assets/svg/PinkLeafSvg";
import Ionicons from "@expo/vector-icons/Ionicons";

const ThankYouScreen = ({ navigation, route }) => {
  const handleSubmit = () => {
    navigation.navigate("LoginScreen");
  };

  const [fontsLoaded] = useFonts({
    Montserrat: require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Medium": require("../../assets/fonts/montserrat/Montserrat-Medium.ttf"),
  });

  return (
    <>
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
            <Text style={styles.title}>Thank you!</Text>
            <PinkLeafSvg style={styles.pinkLeaf} />
          </View>
          <View style={styles.body}>
            <Text style={styles.bodyText}>
              Your account has been created. {"\n"}
              Please check your email and click on activation link to activate
              your account.
            </Text>
            <View style={styles.loginBtnContainer}>
              <TouchableOpacity
                style={styles.loginBtn}
                title="loginSubmit"
                activeOpacity={0.7}
                onPress={handleSubmit}
              >
                <Text style={styles.loginBtnText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <View style={styles.imageContainer}>
          <HealthyLifestyleSvg style={styles.svg} />
        </View>
      </SafeAreaView>
    </>
  );
};

export default ThankYouScreen;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
  },
  navs: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 24,
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
    position: "absolute",
    zIndex: -1,
    top: 24,
    right: 124,
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginTop: 24,
    marginBottom: 8,
    alignItems: "center",
    // borderWidth: 1, borderColor: 'red',
    flex: 1,
  },
  bodyText: {
    fontFamily: "Montserrat",
    color: AppColors.blue,
    fontSize: 20,
    textAlign: "center",
    lineHeight: 32,
  },
  boldText: {
    fontWeight: "bold",
  },
  imageContainer: {
    marginBottom: 8,
    alignItems: "center",
  },
  loginBtnContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  loginBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    color: AppColors.white,
    fontSize: 16,
    fontFamily: "Montserrat-Medium",
    // fontWeight: "medium",
  },
});
