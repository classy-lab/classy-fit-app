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
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 14,
        backgroundColor: bgColor,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: bgColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      <View style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
      }}>
        <MaterialCommunityIcons name={iconName} size={18} color={bgColor === "#dbeafe" ? AppColors.blue : AppColors.white} />
      </View>
      <Text style={{
        fontSize: 12,
        fontWeight: "700",
        color: bgColor === "#dbeafe" ? AppColors.blue : AppColors.white,
        letterSpacing: 0.2,
      }}>
        {label}
      </Text>
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
        <Text style={{ fontSize: 20, marginBottom: 8, color: AppColors.blue }}>
          {`${memberData?.fname || ""} ${memberData?.lname || ""}`.trim() || "Member"}
        </Text>
        <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>{memberData?.sex ? `${memberData.sex.charAt(0).toUpperCase() + memberData.sex.slice(1)}` : "Sex not specified"}</Text>
        <Text style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>Member ID: {memberData?.uid}</Text>
      </View>

      {/* Quick Action Buttons */}
      {/* <Text style={{ fontSize: 14, marginBottom: 12, marginTop: 16, fontWeight: "700", color: "#374151" }}>
        Quick Contact
      </Text> */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
        {memberData?.email && <ContactButton iconName="email" label="Email" value={memberData.email} onPress={handleEmailPress} bgColor={AppColors.blue} />}
        {memberData?.phone && <ContactButton iconName="phone" label="Call" value={memberData.phone} onPress={handlePhoneCall} bgColor="#dbeafe" />}
        {memberData?.whatsapp && <ContactButton iconName="whatsapp" label="WhatsApp" value={memberData.whatsapp} onPress={handleWhatsApp} bgColor="#25d366" />}
      </View>

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
