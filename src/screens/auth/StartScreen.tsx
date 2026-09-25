// @ts-nocheck
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppColors } from "../../styles/colors";
import PinkLeafSvg from "../../assets/svg/PinkLeafSvg";
import { GymContext } from "../../context/GymContext";

const StartScreen = () => {
  const navigation = useNavigation();
  const gymContext = useContext(GymContext);
  const { gymID, setGymID, gymsInfo, gymsLoading, gymsError } = gymContext;
  const [navOpacity, setNavOpacity] = useState(0);

  const gymOptions = useMemo(() => {
    if (!Array.isArray(gymsInfo)) {
      return [];
    }

    return gymsInfo
      .map((gym, index) => {
        if (!gym || index === 0) {
          return null;
        }

        const label = [gym.gym_name, gym.city].filter(Boolean).join(", ");
        return {
          key: String(gym.gym_id ?? index),
          value: label || `Gym ${gym.gym_id ?? index}`,
        };
      })
      .filter(Boolean);
  }, [gymsInfo]);

  const selectedGym = gymID ? gymsInfo?.[gymID] : null;

  useEffect(() => {
    setGymID(null);
    setNavOpacity(0);
  }, [setGymID]);

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Classy Fit</Text>
          <PinkLeafSvg style={styles.pinkLeaf} />
          <Text style={styles.subTitle}>
            {selectedGym?.gym_name
              ? `${selectedGym.gym_name}${selectedGym.city ? `, ${selectedGym.city}` : ""}`
              : "Select a gym to continue"}
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.row}>
            <View style={styles.box}>
              <Text style={styles.boxText}>Gyms</Text>
            </View>
            <View style={styles.box}>
              <Text style={styles.boxText}>Classes</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.box}>
              <Text style={styles.boxText}>Training</Text>
            </View>
          </View>

          <Text style={styles.subTitle}>Built for the modern gym experience</Text>

          <View style={styles.fieldset}>
            <View style={styles.field}>
              <View style={styles.highlightedFieldBox}>
                <Text style={styles.formLabel}>Select a Gym to Continue</Text>
                {gymsLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={AppColors.blue} />
                    <Text style={styles.helperText}>Loading gyms...</Text>
                  </View>
                ) : gymsError ? (
                  <Text style={styles.errorText}>{gymsError}</Text>
                ) : !selectedGym ? (
                  <Text style={styles.helperText}>
                    Select a gym first to enable Register and Login
                  </Text>
                ) : null}
              </View>

              <SelectList
                name="gym"
                setSelected={(val) => {
                  setGymID(Number(val));
                  setNavOpacity(100);
                }}
                data={gymOptions}
                save="key"
                placeholder={gymsLoading ? "Loading gyms..." : "Select a gym"}
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
              />
            </View>
          </View>

          <View style={styles.fieldset}>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.registerBtn, !selectedGym && styles.disabledBtn]}
                disabled={!selectedGym}
                activeOpacity={selectedGym ? 0.8 : 1}
                onPress={() => {
                  navigation.navigate("RegisterScreen", {
                    gym: selectedGym?.gym_name || "",
                    gymId: Number(selectedGym?.gym_id) || "",
                  });
                }}
              >
                <Text style={styles.registerBtnText}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginBtn, !selectedGym && styles.disabledBtn]}
                disabled={!selectedGym}
                activeOpacity={selectedGym ? 0.8 : 1}
                onPress={() => {
                  navigation.navigate("LoginScreen", {
                    gym: selectedGym?.gym_name || "",
                    gymId: String(selectedGym?.gym_id || ""),
                  });
                }}
              >
                <Text style={styles.loginBtnText}>Login</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.createGymLink}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("CreateGymScreen")}
            >
              <Text style={styles.createGymLinkText}>Register a New Gym</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 10,
  },
  box: {
    width: 96,
    aspectRatio: 1,
    borderRadius: 32,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  boxText: {
    color: AppColors.blue,
    fontFamily: "Montserrat",
  },
  fieldset: {},
  field: {},
  highlightedFieldBox: {
    backgroundColor: "#F7F9FC",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
  },
  formLabel: {
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 14,
    marginBottom: 6,
  },
  helperText: {
    color: AppColors.primary,
    fontFamily: "Montserrat",
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: "#B91C1C",
    fontFamily: "Montserrat",
    fontSize: 13,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  createGymLink: {
    marginTop: 16,
    alignSelf: "center",
  },
  createGymLinkText: {
    color: AppColors.blue,
    fontFamily: "Montserrat",
    textDecorationLine: "underline",
    fontSize: 15,
  },
  scrollView: {},
});
