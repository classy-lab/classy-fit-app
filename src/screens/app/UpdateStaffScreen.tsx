// @ts-nocheck
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppColors } from "../../styles/colors";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import SignOut from "../../components/utils/SignOut";
import UpdateStaffForm from "../../components/forms/UpdateStaffForm";

const UpdateStaffScreen = ({ navigation }: { navigation: any }) => {
  const route = useRoute<any>();
  const routeParams = route?.params ?? {};
  const staff = routeParams.staff ?? routeParams.trainer ?? {};
  const staffName = [staff?.fname || "Staff", staff?.lname].filter(Boolean).join(" ");

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
      <View style={styles.content}>
        <View style={styles.headingContainer}>
          <View style={styles.contactInfo}>
            <Text style={styles.title}>{staffName}</Text>
            <Text style={styles.subHead}>Update Staff Info</Text>
          </View>
        </View>
        <View style={styles.body}>
          <UpdateStaffForm navigation={navigation} staffData={staff} />
        </View>
      </View>
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
  contactInfo: {
    alignItems: "center",
  },
  title: {
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 24,
    marginTop: 16,
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
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
