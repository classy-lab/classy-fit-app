// @ts-nocheck
import React, { useState, useEffect, useRef, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppColors } from "../../styles/colors";
import VectorImageSvg from "../../components/svg/VectorImageSvg";
import PinkLeafSvg from "../../assets/svg/PinkLeafSvg";
import { GymContext } from "../../context/GymContext";

const StartScreen = () => {
  const navigation = useNavigation();
  const gyms = [
    { key: "1", value: "Classy Gym, Cobleskill, NY" },
    { key: "2", value: "Vent Fitness, Clifton Park, NY" },
    { key: "3", value: "The Bodyshop Gym, Cobleskill, NY" },
    { key: "4", value: "Sarah's Gym, Cobleskill, NY" },
  ];
  // GymContext variables
  const { gymID, setGymID } = useContext(GymContext);
  const { gymsInfo } = useContext(GymContext);
  const [navOpacity, setNavOpacity] = useState(0);
  const selectedGym = gyms.find((item) => item.key === String(gymID));

  useEffect(() => {
    setGymID(null);
    setNavOpacity(0);
    console.log("setting gymID to null");
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.navs, { opacity: navOpacity }]}>
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
        <TouchableOpacity>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Classy Fit</Text>
            <PinkLeafSvg style={styles.pinkLeaf} />
            <Text style={styles.subTitle}>{selectedGym?.value || ""}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.body}>
          <View style={styles.row}>
            <TouchableOpacity>
              <View style={styles.box}>
                <Text style={styles.boxText}>Gyms</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity>
              <View style={styles.box}>
                <Text style={styles.boxText}>Classes</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TouchableOpacity>
              <View style={styles.box}>
                <Text style={styles.boxText}>Training</Text>
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Text style={styles.subTitle}>
              Built for the modern gym experience
            </Text>
          </TouchableOpacity>

          <View style={styles.fieldset}>
            <View style={styles.field}>
              <View style={styles.highlightedFieldBox}>
                <Text style={styles.formLabel}>Choose Gym for Details</Text>
                {!selectedGym ? (
                  <Text style={styles.helperText}>
                    Select a gym first to enable Register and Login
                  </Text>
                ) : null}
              </View>
              <SelectList
                name="gym"
                setSelected={(val) => {
                  setGymID(val);
                  setNavOpacity(100);
                }} // Send selection to hook-form
                data={gyms}
                save="key"
                placeholder="Select Category"
                boxStyles={{
                  borderColor: AppColors.grey,
                  borderWidth: 1,
                  paddingHorizontal: 8,
                }}
                dropdownStyles={{
                  borderColor: AppColors.grey2,
                  borderWidth: 1,
                  marginTop: 8,
                  backgroundColor: "white",
                }}
              // If you need to force the value from the parent (e.g., reset)
              // defaultOption={data.find(item => item.value === value)}
              />
            </View>
          </View>

          <View style={styles.fieldset}>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.registerBtn, !selectedGym && styles.disabledBtn]}
                disabled={!selectedGym}
                activeOpacity={selectedGym ? 0.8 : 1}
                // title="Register"
                onPress={() => {
                  navigation.navigate("RegisterScreen", {
                    gym: selectedGym?.value || "",
                    gymId: selectedGym?.key || "",
                  });
                }}
              >
                <Text style={styles.registerBtnText}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginBtn, !selectedGym && styles.disabledBtn]}
                disabled={!selectedGym}
                activeOpacity={selectedGym ? 0.8 : 1}
                // title="Login"
                onPress={() => {
                  navigation.navigate("LoginScreen", {
                    gym: selectedGym?.value || "",
                    gymId: selectedGym?.key || "",
                  });
                }}
              >
                <Text style={styles.loginBtnText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.imageContainer}>
        <VectorImageSvg />
      </View>
    </SafeAreaView>
  );
};

export default StartScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    alignItems: "center",
    paddingLeft: 24,
    paddingRight: 24,
  },
  navs: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%",
  },
  headingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 32,
    marginTop: 60,
    width: "100%",
    textAlign: "center",
  },
  subTitle: {
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 16,
    lineHeight: 32,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 24,
    width: 320,
  },
  pinkLeaf: {
    position: "absolute",
    zIndex: -1,
    top: 24,
    right: 80,
  },
  body: {
    marginTop: 16,
    flex: 1,
  },
  bodyText: {
    fontSize: 16,
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
  },
  registerBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  registerBtnText: {
    color: "#fff",
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  loginBtn: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    color: AppColors.blue,
    fontSize: 16,
  },
  imageContainer: {
    marginBottom: 8,
    // borderWidth: 1, borderColor: 'red',
    zIndex: -1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 10,
  },
  fieldset: {},
  chooseText: {
    marginTop: 8,
    marginBottom: 8,
    color: AppColors.blue,
  },
  formLabel: {
    fontWeight: "bold",
    marginBottom: 4,
    color: AppColors.blue,
    fontSize: 16,
  },
  helperText: {
    color: AppColors.primary,
    fontSize: 13,
    marginBottom: 8,
  },
  highlightedFieldBox: {
    backgroundColor: AppColors.grey,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.blue,
  },
  field: {
    marginBottom: 16,
    width: 320,
    alignSelf: "center",
  },
  box: {
    backgroundColor: AppColors.grey,
    width: 90,
    height: 90,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  boxText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
});
