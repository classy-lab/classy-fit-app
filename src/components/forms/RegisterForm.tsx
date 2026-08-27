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
} from "react-native";
import { AppColors } from "../../styles/colors";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SelectList } from "react-native-dropdown-select-list";
import PhoneInput from "react-native-phone-number-input";
import { UserContext } from "../../context/UserContext";
import HoneypotField from "./input_fields/HoneypotField";
import DateOfBirthField from "./input_fields/DateOfBirthField";
import GymList from "../GymList";
import {
  findRoleOption,
  localAvatarOptions,
  MAX_PROFILE_PIC_BYTES,
  MIN_SUBMISSION_TIME_MS,
  normalizeRole,
  roleData,
  schema,
  sexData,
} from "./ProfileScreenForm.constants";
import { styles } from "../../styles/registerFormStyles";
import FlashMessage, {
  showMessage,
  hideMessage,
} from "react-native-flash-message";

const normalizePhoneFieldForApi = (value: unknown) => {
  const phone = String(value ?? "").trim();

  if (phone === "") {
    return "";
  }

  const digits = phone.replace(/\D+/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    return null;
  }

  return `+${digits}`;
};

const getFlagIconUri = (countryCode: string) =>
  `https://flagcdn.com/w40/${String(countryCode || "US").toLowerCase()}.png`;

const RegisterForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [website, setWebsite] = useState("");
  const { webServer } = useContext(UserContext);
  const preselectedGymId = route.params?.gymId || "";

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

  useEffect(() => {
    if (preselectedGymId) {
      setValue("gymId", String(preselectedGymId));
    }
  }, [preselectedGymId, setValue]);

  const [sex, setSelected] = useState(""); // sex state lives here

  const [PreferredContact, setPreferredContact] = React.useState("");
  const preferredContactData = [
    { key: "1", value: "Phone", disabled: false },
    { key: "2", value: "WhatsApp" },
    { key: "3", value: "Email" },
  ];

  const [gyms, setGyms] = useState([]);
  const [role, setRole] = React.useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("US");
  const defaultAvatar = Image.resolveAssetSource(localAvatarOptions[0].asset);

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
      profilePic: {
        uri: defaultAvatar.uri,
        path: defaultAvatar.uri,
        mime: "image/png",
        filename: localAvatarOptions[0].name,
        type: "image/png",
        isLocalAvatar: true,
      },
      email: "test.user1+reg@classyfit.dev",
      password: "TestPass12345",
      confirmPassword: "TestPass12345",
      role: normalizeRole("2"),
      fname: "Ava",
      lname: "Thompson",
      dateOfBirth: "1996-04-18",
      sex: "female",
      phoneNumber: "+15185551234",
      whatsappNumber: "+15185557654",
      preferredContact: "Phone",
      gymId: preselectedGymId || "1",
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

    const normalizedPhone = normalizePhoneFieldForApi(data.phoneNumber);
    if (normalizedPhone === null) {
      showMessage({
        message: "Action Failed",
        description: "phone must be a valid US or international phone number.",
        type: "danger",
        icon: "danger",
      });
      return;
    }

    const normalizedWhatsapp = normalizePhoneFieldForApi(data.whatsappNumber);
    if (normalizedWhatsapp === null) {
      showMessage({
        message: "Action Failed",
        description: "whatsapp must be a valid US or international phone number.",
        type: "danger",
        icon: "danger",
      });
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
    formData.append("phone", normalizedPhone);
    formData.append("whatsapp", normalizedWhatsapp);
    formData.append("preferred_contact", data.preferredContact);
    formData.append("profilePic", {
      uri: data.profilePic?.path || data.profilePic?.uri,
      type: data.profilePic?.mime || data.profilePic?.type || "image/png",
      name: data.profilePic?.filename || data.profilePic?.name || "profile-photo.png",
    } as any);

    // console.log("FormData ready for fetch:", formData);
    // console.log(data.gymId);

    const response = await fetch(
      `${webServer}/api/v1/gyms/${data.gymId}/users`,
      {
        method: "POST",
        body: formData,
      },
    );

    const apiResponse = await response.json();
    console.log("apiResponse: " + JSON.stringify(apiResponse));
    console.log("response status: ", response.status);

    if (response.ok) {
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
      navigation.navigate("ThankYouScreen");
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
                  <Text style={styles.helperText}>Choose a photo from your gallery or pick one of the local avatars below.</Text>
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
                  </View>
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
            render={({ field: { onChange, value } }) => (
              <PhoneInput
                defaultCode={phoneCountryCode}
                value={value}
                layout="first"
                onChangeFormattedText={(formattedValue) => {
                  const normalizedValue = normalizePhoneFieldForApi(formattedValue);
                  onChange(normalizedValue === null ? formattedValue : normalizedValue);
                }}
                onChangeCountry={(country) => setPhoneCountryCode(country.cca2)}
                containerStyle={styles.phoneInputContainer}
                textContainerStyle={styles.phoneInputTextContainer}
                textInputStyle={styles.phoneInputText}
                codeTextStyle={styles.phoneInputCodeText}
                flagButtonStyle={styles.phoneFlagButton}
                countryPickerButtonStyle={styles.phoneFlagButton}
                renderDropdownImage={
                  <View style={styles.phoneDropdownRow}>
                    <Image
                      source={{ uri: getFlagIconUri(phoneCountryCode) }}
                      style={styles.phoneDropdownFlag}
                      resizeMode="cover"
                    />
                    <Text style={styles.phoneDropdownArrow}>▾</Text>
                  </View>
                }
                countryPickerProps={{ withEmoji: false, withFlag: true }}
                textInputProps={{
                  placeholder: "e.g. +44 7700 900123",
                  autoCapitalize: "none",
                }}
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
            render={({ field: { onChange, value } }) => (
              <PhoneInput
                defaultCode={whatsappCountryCode}
                value={value}
                layout="first"
                onChangeFormattedText={(formattedValue) => {
                  const normalizedValue = normalizePhoneFieldForApi(formattedValue);
                  onChange(normalizedValue === null ? formattedValue : normalizedValue);
                }}
                onChangeCountry={(country) => setWhatsappCountryCode(country.cca2)}
                containerStyle={styles.phoneInputContainer}
                textContainerStyle={styles.phoneInputTextContainer}
                textInputStyle={styles.phoneInputText}
                codeTextStyle={styles.phoneInputCodeText}
                flagButtonStyle={styles.phoneFlagButton}
                countryPickerButtonStyle={styles.phoneFlagButton}
                renderDropdownImage={
                  <View style={styles.phoneDropdownRow}>
                    <Image
                      source={{ uri: getFlagIconUri(whatsappCountryCode) }}
                      style={styles.phoneDropdownFlag}
                      resizeMode="cover"
                    />
                    <Text style={styles.phoneDropdownArrow}>▾</Text>
                  </View>
                }
                countryPickerProps={{ withEmoji: false, withFlag: true }}
                textInputProps={{
                  placeholder: "e.g. +44 7700 900123",
                  autoCapitalize: "none",
                }}
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
                onSelectValue={onChange}
                initialValue={preselectedGymId} />
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
    </>
  );
};

export default RegisterForm;
