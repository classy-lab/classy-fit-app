// @ts-nocheck
import { useState, useContext, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  ScrollView,
} from "react-native";
import { UserContext } from "../../context/UserContext";
import { styles } from "../../styles/registerFormStyles";
import { AppColors } from "../../styles/colors";

const UpdateMemberForm = ({ navigation, memberData }: { navigation: any; memberData: any }) => {
  const { webServer } = useContext(UserContext);
  const [profilePicAPIImage, setProfilePicAPIImage] = useState<string>("");

  const preferredContactOptions = [
    { key: "1", value: "Phone" },
    { key: "2", value: "WhatsApp" },
    { key: "3", value: "Email" },
  ];

  // useFocusEffect(
  //   useCallback(() => {
  //     const fetchMemberData = async () => {
  //       try {
  //         const response = await fetch(`${webServer}/api/v1/gyms/${memberData.gym_id}/members/${memberData.uid}`, {
  //           headers: {
  //             Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  //           },
  //         });

  //         const json = await response.text();
  //         const obj = json ? JSON.parse(json) : {};
  //         const payload = obj?.member || obj?.data || obj?.user || obj;

  //         console.log(json);

  //         if (response.status === 200 && payload) {
  //           setDisplayData({ ...memberData, ...payload });
  //           const picturePath = payload?.profilePic || payload?.user_picture_url || memberData.user_picture_url || memberData.profilePic;
  //           setProfilePicAPIImage(picturePath ? `${webServer}/api/${picturePath}` : "");
  //         }
  //       } catch (error) {
  //         console.log("Failed to fetch member data", error);
  //       }
  //     };

  //     fetchMemberData();
  //   }, [memberData.uid, memberData.gym_id, webServer])
  // );

  const getPreferredContactLabel = (contactValue: string) => {
    return preferredContactOptions.find((item) => [item.key, item.value].some((option) => String(option ?? "").trim().toLowerCase() === String(contactValue).trim().toLowerCase()))?.value ?? String(contactValue);
  };

  const memberPictureUri = profilePicAPIImage || (memberData?.user_picture_url ? `${webServer}/api/${memberData.user_picture_url}` : "");

  return (
    <ScrollView style={[styles.fieldset, { paddingHorizontal: 16 }]}>
      {/* Profile Picture */}
      <View style={{ marginBottom: 24 }}>
        <View style={styles.imageContainer}>
          {memberPictureUri ? (
            <Image source={{ uri: memberPictureUri }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <Image source={require("../../assets/images/avatars/profile-img.png")} style={styles.avatar} resizeMode="cover" />
          )}
        </View>
      </View>

      {/* First Name */}
      <View style={{ marginBottom: 18 }}>
        <Text style={[styles.formLabel, { marginBottom: 8 }]}>First Name</Text>
        <Text>{memberData?.fname || "-"}</Text>
      </View>

      {/* Last Name */}
      <View style={{ marginBottom: 18 }}>
        <Text style={[styles.formLabel, { marginBottom: 8 }]}>Last Name</Text>
        <Text>{memberData?.lname || "-"}</Text>
      </View>

      {/* Phone Number */}
      <View style={{ marginBottom: 18 }}>
        <Text style={[styles.formLabel, { marginBottom: 8 }]}>Phone Number</Text>
        <Text style={{ fontSize: 16, color: "#333" }}>{memberData?.phone || "-"}</Text>
      </View>

      {/* Sex */}
      <View style={{ marginBottom: 18 }}>
        <Text style={[styles.formLabel, { marginBottom: 8 }]}>Sex</Text>
        <Text style={{ fontSize: 16, color: "#333" }}>{memberData?.sex || "-"}</Text>
      </View>

      {/* WhatsApp Number */}
      <View style={{ marginBottom: 18 }}>
        <Text style={[styles.formLabel, { marginBottom: 8 }]}>WhatsApp Number</Text>
        <Text style={{ fontSize: 16, color: "#333" }}>{memberData?.whatsapp || "-"}</Text>
      </View>

      {/* Email */}
      <View style={{ marginBottom: 18 }}>
        <Text style={[styles.formLabel, { marginBottom: 8 }]}>E-mail</Text>
        <Text>{memberData?.email || "-"}</Text>
      </View>

      {/* Preferred Contact */}
      <View style={{ marginBottom: 24 }}>
        <Text style={[styles.formLabel, { marginBottom: 8 }]}>Preferred Contact</Text>
        <Text>{getPreferredContactLabel(memberData?.preferred_contact) || "-"}</Text>
      </View>
    </ScrollView>
  );
};

export default UpdateMemberForm;
