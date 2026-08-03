// @ts-nocheck
import React, { useContext, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { AppColors } from "../../styles/colors";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import VectorImageSvg from "../../components/svg/VectorImageSvg";
import SignOut from "../../components/utils/SignOut";
import { UserContext } from "../../context/UserContext";
import UpdateStaffForm from "../../components/forms/UpdateStaffForm";

const UpdateStaffScreen = ({ navigation }: { navigation: any }) => {
  const route = useRoute<any>();
  const { webServer, tokens, setTokens } = useContext(UserContext);

  const staff = route?.params?.staff || {};

  useEffect(() => {
    if (!staff?.uid && !staff?.id && !staff?.user_id && !staff?.sub) {
      console.log("No staff id available for update screen");
    }
  }, [staff]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Feather
          name="arrow-left"
          color={AppColors.blue}
          size={36}
          onPress={() => navigation.goBack()}
        />
        <SignOut />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headingContainer}>
          <View style={styles.contactInfo}>
            <Text style={styles.title}>
              {staff?.fname || "Staff"} {staff?.lname || ""}
            </Text>
            <Text style={styles.subHead}>Update Staff Information</Text>
          </View>
        </View>
        <View style={styles.body}>
          <UpdateStaffForm navigation={navigation} staff={staff} />
        </View>
        <View style={styles.imageContainer}>
          <VectorImageSvg />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UpdateStaffScreen;

const styles = StyleSheet.create({
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
    marginBottom: 4,
  },
  title: {
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 32,
    marginTop: 32,
    textAlign: "center",
  },
  subHead: {
    fontFamily: "Montserrat",
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 8,
    flex: 1,
  },
  imageContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  scrollView: {},
});
