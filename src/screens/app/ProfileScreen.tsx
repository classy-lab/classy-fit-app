// @ts-nocheck
import React, { useContext, useEffect } from "react";
import { UserContext } from "../../context/UserContext";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { AppColors } from "../../styles/colors";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import VectorImageSvg from "../../components/svg/VectorImageSvg";
import ProfileScreenForm from "../../components/forms/ProfileScreenForm";
import { normalizeRole } from "../../components/forms/ProfileScreenForm.constants";
import SignOut from "../../components/utils/SignOut";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);
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
          <SignOut />
        </View>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headingContainer}>
            <Text value={user?.given_name} style={styles.title}>
              {user?.given_name} {user?.family_name}
            </Text>
            <Text style={styles.subHead}>{normalizeRole(user?.role)}</Text>
          </View>
          <View style={styles.body}>
            <ProfileScreenForm />
            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MyMembershipScreen')}
            >
              <Feather name="credit-card" color={AppColors.blue} size={20} />
              <Text style={styles.menuButtonText}>My Membership</Text>
              <Feather name="chevron-right" color={AppColors.blue} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MyPersonalTrainingBookingsScreen')}
            >
              <Feather name="calendar" color={AppColors.blue} size={20} />
              <Text style={styles.menuButtonText}>My Personal Training Bookings</Text>
              <Feather name="chevron-right" color={AppColors.blue} size={20} />
            </TouchableOpacity>
          </View>
          <View style={styles.imageContainer}>
            <VectorImageSvg />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 24,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
  },
  signOutText: {
    marginLeft: 10,
    marginRight: 4,
    color: AppColors.blue,
    fontSize: 14,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    backgroundColor: AppColors.blue,
    justifyContent: "center",
    alignItems: "center",
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
  },
  pinkLeaf: {
    position: "relative",
    zIndex: -1,
    top: -68,
    right: -40,
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
  card: { alignSelf: "center", marginTop: 16 },
  subHead: {
    fontFamily: "Montserrat",
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 8,
  },
  scrollView: {},
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderColor: AppColors.grey,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  menuButtonText: {
    fontSize: 16,
    color: AppColors.blue,
    flex: 1,
    marginLeft: 12,
  },
});
