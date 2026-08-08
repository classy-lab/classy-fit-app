// @ts-nocheck
import React, { useContext, useEffect, useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { AppColors } from "../../styles/colors";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import VectorImageSvg from "../../components/svg/VectorImageSvg";
import SignOut from "../../components/utils/SignOut";
import UpdateMemberForm from "../../components/forms/UpdateMemberForm";
import { UserContext } from '../../context/UserContext'

const UpdateMemberScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const route = useRoute<any>();
  const member = route?.params?.member || {};
  const [memberData, setMemberData] = useState(member);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/members/${memberId}`, { // /api/v1/gyms/${gymId}/members/${uid}
          headers: {
            Authorization: "Bearer " + tokens.access_token,
          }
        });

        const json = await response.json();
        const fetchedMember = json?.member || json?.data || json?.user || json;

        if (response.ok) {
          setMemberData((prev: any) => ({
            ...prev,
            ...fetchedMember,
          }));

        }
        else {
          console.log("Access token expired, requesting new one - useFocusEffect()");

          const response = await fetch(`${webServer}/api/refresh.php`, {
            method: "POST",
            body: JSON.stringify({
              token: tokens.refresh_token,
            }),
          });

          const json = await response.text();
          const obj = JSON.parse(json);

          if (response.status === 200) {
            console.log("Got new access token and refresh token");
            setTokens((prev: any) => ({
              ...prev,
              access_token: obj.access_token,
              refresh_token: obj.refresh_token,
            }));
          }
        }
      } catch (error) {
        console.log('Failed to fetch member data:', error);
      }
    }

    fetchMemberData();
  }, [tokens?.access_token, tokens?.refresh_token, setTokens]);

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
              {memberData?.fname || member?.fname || "Member"} {memberData?.lname || member?.lname || ""}
            </Text>
            <Text style={styles.subHead}>Update Member Information</Text>
          </View>
        </View>
        <View style={styles.body}>
          <UpdateMemberForm navigation={navigation} memberData={memberData} />
        </View>
        <View style={styles.imageContainer}>
          <VectorImageSvg />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UpdateMemberScreen;

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
