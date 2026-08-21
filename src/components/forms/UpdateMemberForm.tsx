// @ts-nocheck
import { useState, useContext, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
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

  const getPreferredContactLabel = (contactValue: string) => {
    return preferredContactOptions.find((item) => [item.key, item.value].some((option) => String(option ?? "").trim().toLowerCase() === String(contactValue).trim().toLowerCase()))?.value ?? String(contactValue);
  };

  const handlePhoneCall = () => {
    if (memberData?.phone) {
      if (Platform.OS === "ios") {
        // In simulator, show alert. On real device, open phone app
        Linking.canOpenURL(`tel:${memberData.phone}`).then(supported => {
          if (supported) {
            Linking.openURL(`tel:${memberData.phone}`);
          } else {
            // Simulator fallback
            Alert.alert("📱 Phone Call", `Would call: ${memberData.phone}`, [
              { text: "OK", onPress: () => { } }
            ]);
          }
        });
      } else {
        Linking.openURL(`tel:${memberData.phone}`);
      }
    }
  };

  const handleWhatsApp = () => {
    if (memberData?.whatsapp) {
      const whatsappUrl = `https://wa.me/${memberData.whatsapp}`;
      if (Platform.OS === "ios") {
        Linking.canOpenURL(whatsappUrl).then(supported => {
          if (supported) {
            Linking.openURL(whatsappUrl);
          } else {
            Alert.alert("💬 WhatsApp", `Would open WhatsApp for: ${memberData.whatsapp}`, [
              { text: "OK", onPress: () => { } }
            ]);
          }
        });
      } else {
        Linking.openURL(whatsappUrl);
      }
    }
  };

  const handleEmailPress = () => {
    if (memberData?.email) {
      const mailUrl = `mailto:${memberData.email}`;
      if (Platform.OS === "ios") {
        Linking.openURL(mailUrl).catch(() => {
          // Fallback for simulator
          Alert.alert("✉ Send Email", `Open email client to send mail to: ${memberData.email}`, [
            { text: "OK", onPress: () => { } }
          ]);
        });
      } else {
        Linking.openURL(mailUrl);
      }
    }
  };

  const ContactButton = ({ iconName, label, value, onPress, bgColor }: { iconName: string; label: string; value: string; onPress: () => void; bgColor: string }) => (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={{
        marginBottom: 14,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: bgColor,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      <View style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "rgba(255,255,255,0.3)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16
      }}>
        <MaterialCommunityIcons name={iconName} size={26} color={AppColors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 5, fontWeight: "500" }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{value || "Not provided"}</Text>
      </View>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
      }}>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  const InfoField = ({ label, value }: { label: string; value: string }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{
        backgroundColor: AppColors.grey,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: AppColors.blue,
      }}>
        <Text style={{ fontSize: 14, color: AppColors.primary }}>
          {value || "—"}
        </Text>
      </View>
    </View>
  );

  const memberPictureUri = profilePicAPIImage || (memberData?.user_picture_url ? `${webServer}/api/${memberData.user_picture_url}` : "");

  return (
    <ScrollView style={[styles.fieldset, { paddingHorizontal: 16, paddingVertical: 20, backgroundColor: "#ffffff" }]}>
      {/* Profile Card Header */}
      <View style={{
        marginBottom: 28,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      }}>
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          overflow: "hidden",
          marginBottom: 16,
          borderWidth: 1,
          borderColor: AppColors.blue,
        }}>
          {memberPictureUri ? (
            <Image source={{ uri: memberPictureUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <Image source={require("../../assets/images/avatars/profile-img.png")} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          )}
        </View>
        {/* <Text style={{ fontSize: 20, marginBottom: 8 }}>
          {`${memberData?.fname || ""} ${memberData?.lname || ""}`.trim() || "Member"}
        </Text> */}
        <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>{memberData?.sex ? `${memberData.sex.charAt(0).toUpperCase() + memberData.sex.slice(1)}` : "Sex not specified"}</Text>
        <Text style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>Member ID: {memberData?.uid}</Text>
      </View>

      {/* Quick Action Buttons */}
      <Text style={{ fontSize: 14, marginBottom: 12, marginTop: 16 }}>
        Quick Contact
      </Text>
      {memberData?.phone && <ContactButton iconName="phone" label="Phone Call" value={memberData.phone} onPress={handlePhoneCall} bgColor={AppColors.blue} />}
      {memberData?.whatsapp && <ContactButton iconName="whatsapp" label="WhatsApp" value={memberData.whatsapp} onPress={handleWhatsApp} bgColor="#25d366" />}
      {memberData?.email && <ContactButton iconName="email" label="Send Email" value={memberData.email} onPress={handleEmailPress} bgColor={AppColors.blue} />}

      {/* Divider */}
      <View style={{ marginTop: 24 }} />

      <InfoField label="First Name" value={memberData?.fname} />
      <InfoField label="Last Name" value={memberData?.lname} />
      <InfoField label="Gender" value={memberData?.sex} />
      <InfoField label="Phone Number" value={memberData?.phone} />
      <InfoField label="WhatsApp" value={memberData?.whatsapp} />
      <InfoField label="E-mail" value={memberData?.email} />
      <InfoField label="Preferred Contact Method" value={getPreferredContactLabel(memberData?.preferred_contact)} />

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

export default UpdateMemberForm;
