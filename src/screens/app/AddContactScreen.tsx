// @ts-nocheck
import React, { useState, useEffect, useRef, useContext } from "react";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ImagePicker from "react-native-image-crop-picker";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  Image,
  Button,
  ScrollView
} from "react-native";
import { AppColors } from "../../styles/colors";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import VectorImageSvg from "../../components/svg/VectorImageSvg";
import { SelectList } from "react-native-dropdown-select-list";
import { UserContext } from "../../context/UserContext";
import HoneypotField from "../../../src/components/forms/input_fields/HoneypotField";
import DateOfBirthField from "../../../src/components/forms/input_fields/DateOfBirthField";
import GymList from "../../../src/components/GymList";
import SignOut from "../../components/utils/SignOut";
import {
  findRoleOption,
  localAvatarOptions,
  MAX_PROFILE_PIC_BYTES,
  MIN_SUBMISSION_TIME_MS,
  normalizeRole,
  roleData,
  schema,
  sexData,
} from "../../../src/components/forms/ProfileScreenForm.constants";
import FlashMessage, {
  showMessage,
  hideMessage,
} from "react-native-flash-message";
import { StyleSheet } from 'react-native'

const AddContactScreen = ({ navigation }: { navigation: any }) => {
  const [website, setWebsite] = useState("");
  const { webServer } = useContext(UserContext);
  const { user, setUser } = useContext(UserContext);

  const selectImage = async (onChange: (value: any) => void) => {
    try {
      const profilePic = await ImagePicker.openPicker({
        cropping: true,
        width: 380,
        height: 380,
        compressImageQuality: 0.7,
        forceJpg: true,
        mediaType: "photo",
      });

      const filename = (profilePic.filename || profilePic.path || "").toLowerCase();
      const isAllowedFormat = filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png");
      const fileSize = (profilePic as any).fileSize ?? (profilePic as any).size;

      if (!isAllowedFormat) {
        Alert.alert("Unsupported Format", "Please select a JPEG or PNG image.");
        return;
      }

      if (fileSize && fileSize > MAX_PROFILE_PIC_BYTES) {
        Alert.alert("Image Too Large", "Please select an image that is 5 MB or less.");
        return;
      }

      onChange({
        ...profilePic,
        path: profilePic.path,
        mime: profilePic.mime,
        filename: profilePic.filename || "gallery-photo.png",
        fileSize,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const selectLocalAvatar = (avatar: any, onChange: (value: any) => void) => {
    const resolved = Image.resolveAssetSource(avatar.asset);
    onChange({
      uri: resolved.uri,
      path: resolved.uri,
      mime: "image/png",
      filename: avatar.name,
      type: "image/png",
      isLocalAvatar: true,
    });
  };

  // Use a ref to store the load time without triggering re-renders
  const formLoadTime = useRef(Date.now());

  // Reset the timer if the user navigates back to this screen
  useEffect(() => {
    formLoadTime.current = Date.now();
  }, []);

  const [sex, setSelected] = useState(""); // sex state lives here

  const [PreferredContact, setPreferredContact] = React.useState("");
  const preferredContactData = [
    { key: "1", value: "Phone", disabled: false },
    { key: "2", value: "WhatsApp" },
    { key: "3", value: "Email" },
  ];

  const [gyms, setGyms] = useState([]);
  const [role, setRole] = React.useState("");

  // This is the "onChange" logic for GymList
  const handleSelectionChange = (val) => {
    setGyms(val);
  };

  const handleLinkPress = () => {
    Linking.openURL("https://cleancodeusa.com/about.html");
  };

  // 2. Initialize useForm with the Yup resolver
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    shouldFocusError: true, // Automatically moves focus and triggers internal scrolling layout
    defaultValues: {
      profilePic: undefined,
      email: "",
      password: "",
      confirmPassword: "",
      role: normalizeRole("2"),
      fname: "",
      lname: "",
      dateOfBirth: "",
      sex: '',
      phoneNumber: "",
      whatsappNumber: "",
      gymId: "",
    },
  });

  // Watch profilePic to display it
  const profilePicValue = watch("profilePic");

  // 3. Define the submit handler
  const registerUser = async (data: any) => {
    const totalTimeElapsed = Date.now() - formLoadTime.current;
    const formData = new FormData();

    console.log(data);

    // 1. Honeypot check
    if (website.trim() !== "") {
      console.log("Submission failed", "Bot behavior detected.");
      return;
    }

    // 2. Timestamp check
    if (totalTimeElapsed < MIN_SUBMISSION_TIME_MS) {
      console.log("Submission failed", "Form submitted too quickly.");
      return;
    }

    formData.append("gym_id", data.gymId);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("data.confirmPassword", data.confirmPassword);
    formData.append("role", normalizeRole(data.role));
    formData.append("fname", data.fname);
    formData.append("lname", data.lname);
    formData.append("date_of_birth", data.dateOfBirth);
    formData.append("sex", data.sex);
    formData.append("phone", data.phoneNumber);
    formData.append("whatsapp", data.whatsappNumber);
    formData.append("preferred_contact", data.preferredContact);
    formData.append("profilePic", {
      uri: data.profilePic?.path || data.profilePic?.uri,
      type: data.profilePic?.mime || data.profilePic?.type || "image/png",
      name: data.profilePic?.filename || data.profilePic?.name || "profile-photo.png",
    } as any);

    console.log("FormData ready for fetch:", formData);

    const response = await fetch(
      `${webServer}/api/register-contact.php`,
      {
        method: "POST",
        body: formData,
      },
    );

    const apiResponse = await response.json();
    console.log("apiResponse: " + JSON.stringify(apiResponse));

    if (response.status == 200) {
      showMessage({
        message: "Success",
        description:
          apiResponse.message || "Your action was confirmed successfully!",
        type: "success",
        icon: "success",
        duration: 3000,
        // autoHide: false,
        onPress: () => hideMessage(),
      });
    } else {
      showMessage({
        message: "Action Failed",
        description: apiResponse.message || "Something went wrong.",
        type: "danger", // Automatically styles background to red
        icon: "danger",
        autoHide: false,
      });
    }
  };

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
            <Text style={styles.title}>
              Add Contact
            </Text>
          </View>
          <View style={styles.body}>

            <View style={styles.fieldset}>
              <View style={styles.field}>
                <Controller
                  control={control}
                  name="profilePic"
                  render={({ field: { onChange, value } }) => {
                    const selectedProfilePicUri = (value as any)?.path || (value as any)?.uri || "";

                    return (
                      <View style={styles.imageContainer}>
                        <Text style={styles.formLabel}>Profile Photo</Text>
                        <TouchableOpacity onPress={() => selectImage(onChange)} style={styles.imagePickerButton}>
                          {selectedProfilePicUri ? (
                            <Image source={{ uri: selectedProfilePicUri }} style={styles.avatar} resizeMode="cover" />
                          ) : (
                            <Image source={require("../../assets/images/avatars/profile-img.png")} style={styles.avatar} resizeMode="cover" />
                          )}
                        </TouchableOpacity>
                        {/* <Text style={styles.helperText}>Choose a photo from your gallery or pick one of the local avatars below.</Text>
                        <View style={styles.avatarGrid}>
                          {localAvatarOptions.map((avatar) => (
                            <TouchableOpacity
                              key={avatar.key}
                              onPress={() => selectLocalAvatar(avatar, onChange)}
                              style={styles.avatarOption}
                            >
                              <Image source={avatar.asset} style={styles.avatarOptionImage} resizeMode="cover" />
                            </TouchableOpacity>
                          ))}
                        </View> */}
                      </View>
                    );
                  }}
                />
                {errors.profilePic && (
                  <Text style={styles.errorText}>{errors.profilePic.message}</Text>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.formLabel}>E-mail</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextInput
                      ref={ref} // CRITICAL: This allows React Hook Form to directly target the element
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.formLabel}>Password</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextInput
                      ref={ref} // CRITICAL: This allows React Hook Form to directly target the element
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="default"
                      secureTextEntry
                    />
                  )}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password.message}</Text>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.formLabel}>Confirm Password</Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextInput
                      ref={ref} // CRITICAL: This allows React Hook Form to directly target the element
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="default"
                      secureTextEntry
                    />
                  )}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>
                    {errors.confirmPassword.message}
                  </Text>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.formLabel}>Role</Text>
                <Controller
                  control={control}
                  name="role"
                  render={({ field: { onChange, onBlur, value, ref } }) => {
                    const selectedRole =
                      findRoleOption(value) || findRoleOption("2");

                    return (
                      <SelectList
                        ref={ref} // CRITICAL: This allows React Hook Form to directly target the element
                        setSelected={(selectedValue) =>
                          onChange(normalizeRole(selectedValue))
                        }
                        data={roleData}
                        save="value"
                        placeholder="Select Category"
                        defaultOption={
                          selectedRole
                            ? { key: selectedRole.key, value: selectedRole.value }
                            : undefined
                        }
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
                    );
                  }}
                />
                {errors.role && (
                  <Text style={styles.errorText}>{errors.role.message}</Text>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.formLabel}>First Name</Text>
                <Controller
                  control={control}
                  name="fname"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextInput
                      ref={ref} // CRITICAL: This allows React Hook Form to directly target the element
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="default"
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.fname && (
                  <Text style={styles.errorText}>{errors.fname.message}</Text>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.formLabel}>Last Name</Text>
                <Controller
                  control={control}
                  name="lname"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextInput
                      ref={ref} // CRITICAL: This allows React Hook Form to directly target the element
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="default"
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.lname && (
                  <Text style={styles.errorText}>{errors.lname.message}</Text>
                )}
              </View>
              {/* 3. Include the honeypot trap in your form */}
              <HoneypotField value={website} onChangeText={setWebsite} />
              <View style={styles.field}>
                <Text style={styles.formLabel}>Date of Birth</Text>
                <Controller
                  control={control}
                  name="dateOfBirth"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <DateOfBirthField
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.dateOfBirth && (
                  <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.formLabel}>Sex</Text>
                <Controller
                  name="sex"
                  control={control}
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <SelectList
                      ref={ref} // CRITICAL: This allows React Hook Form to directly target the element
                      setSelected={(val) => onChange(val)} // Send selection to hook-form
                      data={sexData}
                      save="value"
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
                  )}
                />
                {errors.sex && (
                  <Text style={styles.errorText}>{errors.sex.message}</Text>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <Controller
                  control={control}
                  name="phoneNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="default"
                      autoCapitalize="none"
                      placeholder="518-555-5555"
                    />
                  )}
                />
                {errors.phoneNumber && (
                  <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.formLabel}>WhatsApp Number</Text>
                <Controller
                  control={control}
                  name="whatsappNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="default"
                      placeholder="518-555-5555"
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.whatsappNumber && (
                  <Text style={styles.errorText}>
                    {errors.whatsappNumber.message}
                  </Text>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.formLabel}>Preferred Contact</Text>
                <Controller
                  control={control}
                  name="preferredContact"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <SelectList
                      ref={ref} // CRITICAL: This allows React Hook Form to directly target the element
                      setSelected={(val) => onChange(val)} // Send selection to hook-form
                      data={preferredContactData}
                      save="value"
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
                  )}
                />
                {errors.preferredContact && (
                  <Text style={styles.errorText}>
                    {errors.preferredContact.message}
                  </Text>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.formLabel}>Gym Location / Fitness Center</Text>
                <Controller
                  control={control}
                  name="gymId"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <GymList
                      ref={ref} // CRITICAL: This allows React Hook Form to directly target the element
                      onSelectValue={onChange} />
                  )}
                />
                {errors.gymId && (
                  <Text style={styles.errorText}>{errors.gymId.message}</Text>
                )}
              </View>
              <Text style={styles.agreement}>
                By using Classy Fit, you agree and consent to our:{" "}
                <Text style={styles.linkText} onPress={handleLinkPress}>
                  Terms of Service -{" "}
                  <Text style={styles.linkText} onPress={handleLinkPress}>
                    Cookie Policy -{" "}
                  </Text>
                  <Text style={styles.linkText} onPress={handleLinkPress}>
                    Privacy Policy
                  </Text>
                </Text>
              </Text>
              <View style={styles.loginBtnContainer}>
                <TouchableOpacity
                  style={styles.loginBtn}
                  title="loginSubmit"
                  onPress={handleSubmit(registerUser)}
                >
                  <Text style={styles.loginBtnText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
          <View style={styles.imageContainer}>
            <VectorImageSvg />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default AddContactScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  navs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headingContainer: {
    alignItems: "center",
  },
  title: {
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 32,
    marginTop: 40,
    // marginBottom: 40,
    width: 320,
    textAlign: "center",
  },
  pinkLeaf: {
    position: "relative",
    zIndex: -1,
    top: -68,
    right: -40,
  },
  body: {
    flex: 1,
  },
  bodyText: {
    fontSize: 16,
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
  },
  fieldset: {
    marginBottom: 32,
  },
  formLabel: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  inputField: {
    marginTop: 5,
    borderWidth: 1,
    paddingLeft: 8,
    borderColor: AppColors.textInputBorderColor,
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.grey,
  },
  inputButton: {
    marginTop: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    borderColor: AppColors.textInputBorderColor,
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.grey,
    justifyContent: "center",
  },
  inputButtonText: {
    color: AppColors.primary,
  },
  inputButtonPlaceholder: {
    color: AppColors.grey3,
  },
  errorText: {
    color: AppColors.red,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20
  },
  imagePickerButton: {
    // marginTop: 4,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 20,
    borderColor: AppColors.grey2,
  },
  helperText: {
    fontSize: 12,
    color: AppColors.grey2,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  avatarOption: {
    margin: 1,
  },
  avatarOptionImage: {
    width: 48,
    height: 48,
    // borderRadius: 28,
    // borderWidth: 1,
    borderColor: AppColors.grey2,
  },
  loginBtnContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  loginBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 250,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    color: AppColors.white,
    fontSize: 14,
  },
  selectList: {
    marginBottom: 80,
  },
  agreement: {
    fontSize: 12,
    marginTop: 20,
    lineHeight: 24,
  },
  linkText: {
    fontSize: 12,
    color: AppColors.blue,
  },
  field: {},
});
