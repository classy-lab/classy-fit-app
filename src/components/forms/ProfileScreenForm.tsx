import { useState, useEffect, useRef, useContext } from "react";
import { Alert, ScrollViewComponent, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ImagePicker from "react-native-image-crop-picker";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { AppColors } from "../../styles/colors";
import { SelectList } from "react-native-dropdown-select-list";
import PhoneInput from "react-native-phone-number-input";
import { UserContext } from "../../context/UserContext";
import HoneypotField from "./input_fields/HoneypotField";
import DateOfBirthField from "./input_fields/DateOfBirthField";
import PreferredContact from "./PreferredContact";
import GymList from "../GymList";
import { globalStyles } from "../../styles/globalStyles";
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
import {
  logGymRequestDiagnostics,
  logGymRequestResponse,
  logGymRefreshResponse,
} from "../../utils/devGymRequestDiagnostics";

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

const normalizePreferredContact = (value: unknown) => {
  const raw = String(value ?? "").trim();

  if (raw === "1") return "Phone";
  if (raw === "2") return "WhatsApp";
  if (raw === "3") return "Email"
  return raw;
};

const normalizeSexValue = (value: unknown) => {
  const raw = String(value ?? "").trim().toLowerCase();

  if (raw === "1") return "male";
  if (raw === "2") return "female";
  if (raw === "3") return "other";

  return raw;
};

const normalizeDateOfBirthValue = (value: unknown) => {
  const raw = String(value ?? "").trim();

  if (raw === "") {
    return "";
  }

  const dateMatch = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  return dateMatch ? dateMatch[1] : raw;
};

// ============================================================================
// COMPONENT
// ============================================================================

const ProfileScreenForm = ({ navigation }: { navigation: any }) => {
  const { user, setUser } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const [website, setWebsite] = useState("");
  const { webServer } = useContext(UserContext);
  const { setIsLoggedIn } = useContext(UserContext);
  const [profilePicAPIImage, setProfilePicAPIImage] = useState<string>(""); // State to hold the selected image
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("US");
  const [phoneDefaultValue, setPhoneDefaultValue] = useState("");
  const [whatsappDefaultValue, setWhatsappDefaultValue] = useState("");
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
        Alert.alert("Unsupported Format. Please select a JPEG or PNG image.");
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

  // Initialize useForm with the Yup resolver
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    shouldFocusError: true, // Automatically moves focus and triggers internal scrolling layout
    defaultValues: {
      profilePic: undefined,
      email: user?.email,
      password: "",
      confirmPassword: "",
      role: normalizeRole(user?.role),
      fname: user?.given_name,
      lname: user?.family_name,
      dateOfBirth: user?.date_of_birth,
      sex: user?.gender,
      phoneNumber: '',
      whatsappNumber: '',
      preferredContact: user?.preferred_contact,
      gymId: user?.gym_id,
    },
  });

  // Watch profilePic to display it
  const profilePicValue = watch("profilePic");

  // Reset the timer if the user navigates back to this screen
  useEffect(() => {
    formLoadTime.current = Date.now();
    const fetchUserData = async (accessToken = tokens?.access_token, isRetry = false) => {
      if (!user?.sub || !accessToken) {
        return;
      }

      const requestContext = {
        screen: "ProfileScreenForm",
        endpoint: `/api/v1/gyms/${user?.gym_id}/users/${user?.sub}`,
        gymId: user?.gym_id,
        userId: user?.sub,
      };

      try {
        logGymRequestDiagnostics(requestContext, "request", {
          refreshAttempted: false,
          originalRequestRetried: isRetry,
        });

        const response = await fetch(`${webServer}/api/v1/gyms/${user?.gym_id}/users/${user?.sub}`, {
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        });
        const json = await response.text();
        logGymRequestResponse(requestContext, response.status, json, {
          refreshAttempted: false,
          originalRequestRetried: isRetry,
        });
        const obj = json ? JSON.parse(json) : {};
        const payload = obj?.data ?? obj?.profile_fields ?? obj?.profileFields ?? null;
        console.log("Fetched user data:", payload);

        if (response.status == 200) {
          const fetchedPhone = String(payload?.phone ?? "");
          const fetchedWhatsapp = String(payload?.whatsapp ?? "");
          const fetchedSex = normalizeSexValue(payload?.sex);
          const fetchedPreferredContact = normalizePreferredContact(payload?.preferred_contact);
          const profilePicturePath = payload?.user_picture_url;
          const fetchedDateOfBirth = normalizeDateOfBirthValue(payload?.date_of_birth);

          reset({
            profilePic: profilePicturePath ? { path: `${webServer}/api/${profilePicturePath}` } : undefined,
            email: user?.email ?? "",
            password: "",
            confirmPassword: "",
            role: normalizeRole(user?.role),
            fname: user?.given_name ?? "",
            lname: user?.family_name ?? "",
            dateOfBirth: fetchedDateOfBirth,
            sex: fetchedSex,
            phoneNumber: fetchedPhone,
            whatsappNumber: fetchedWhatsapp,
            preferredContact: fetchedPreferredContact,
            gymId: user?.gym_id ?? "",
          });
          setPhoneDefaultValue(fetchedPhone);
          setWhatsappDefaultValue(fetchedWhatsapp);
          setValue("dateOfBirth", fetchedDateOfBirth, { shouldDirty: false, shouldValidate: false });
          setValue("phoneNumber", fetchedPhone, { shouldDirty: false, shouldValidate: false });
          setValue("whatsappNumber", fetchedWhatsapp, { shouldDirty: false, shouldValidate: false });
          setProfilePicAPIImage(profilePicturePath ? `${webServer}/api/${profilePicturePath}` : "");
          return;
        }

        const responseMessage = String(obj?.message || obj?.error || "").trim();

        if (response.status === 401 && /expired|invalid/i.test(responseMessage) && tokens?.refresh_token) {
          logGymRequestDiagnostics(requestContext, "response", {
            refreshAttempted: true,
            originalRequestRetried: isRetry,
            tokenRefreshAttempted: true,
          });

          const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
            method: "POST",
            body: JSON.stringify({
              token: tokens.refresh_token,
            }),
          });

          const refreshJson = await refreshResponse.text();
          logGymRefreshResponse(requestContext, refreshResponse.status, refreshJson, {
            tokenRefreshAttempted: true,
            tokenRefreshSucceeded: refreshResponse.status === 200,
            originalRequestRetried: isRetry,
          });
          const refreshObj = refreshJson ? JSON.parse(refreshJson) : {};

          if (refreshResponse.status == 200) {
            setTokens({
              ...tokens,
              access_token: refreshObj.access_token,
              refresh_token: refreshObj.refresh_token,
            });
            await fetchUserData(refreshObj.access_token, true);
          }
          return;
        }

        logGymRequestDiagnostics(requestContext, "response", {
          refreshAttempted: false,
          originalRequestRetried: isRetry,
        });
        console.log("Failed to fetch profile data:", responseMessage || `status ${response.status}`);
      } catch (error) {
        console.log("Failed to fetch user data", error);
      }
    };

    fetchUserData();
  }, [reset, user?.sub, tokens?.access_token, tokens?.refresh_token, webServer]);

  const executeProfileDeletion = async ({ tokens, webServer, user, setTokens }) => {
    console.log("Profile deletion API initiated.");

    const response = await fetch(
      `${webServer}/api/v1/gyms/${user?.gym_id}/users/${user?.sub}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + tokens.access_token,
        },
        body: user.sub,
      },
    );

    const json = await response.text();;
    const obj = JSON.parse(json);


    if (response.status == 200) {
      console.log(obj);
      showMessage({
        message: obj?.message,
        type: "success",
        autoHide: true, // prevents the message from disappearing automatically
        onPress: () => hideMessage(), // closes the message when pressed
      });

      // // Optionally, you can also clear the user context or navigate to a different screen after deletion
      setUser(null);
      setTokens(null);
      setIsLoggedIn(false);
    }
    else {
      console.log("Access token expired, requesting new one - executeProfileDeletion()");

      const response = await fetch(`${webServer}/api/v1/refresh`, {
        method: "POST",
        body: JSON.stringify({
          token: tokens.refresh_token,
        }),
      });

      const json = await response.text();
      const obj = JSON.parse(json);

      if (response.status == 200) {
        console.log("Got new access token and refresh token");
        setTokens({
          ...tokens,
          access_token: obj.access_token,
          refresh_token: obj.refresh_token,
        });
      }
    }
  };

  // 2. Build the confirmation modal configuration
  const handleDeletePress = () => {
    Alert.alert(
      "Delete Profile", // Dialog Title
      "Are you absolutely sure? This action is permanent and your account cannot be recovered.", // Dialog Description
      [
        {
          text: "Cancel",
          onPress: () => console.log("Deletion cancelled"),
          style: "cancel", // Stylizes text as a neutral cancel action
        },
        {
          text: "Delete My Account",
          onPress: () => executeProfileDeletion({ tokens, webServer, user, setTokens }),
          style: "destructive", // Colors the font red on iOS platforms
        },
      ],
      { cancelable: true }, // Allows Android users to dismiss by clicking background
    );
  };

  // 3. Define the submit handler
  const updateUser = async (data: any) => {
    const totalTimeElapsed = Date.now() - formLoadTime.current;
    const formData = new FormData();

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

    const preferredContact = normalizePreferredContact(data.preferredContact);
    const normalizedSex = normalizeSexValue(data.sex);

    // Set submitted values within app before sending to API. No need to retreive from API
    setUser({
      ...user,
      given_name: data.fname,
      family_name: data.lname,
      gender: normalizedSex,
      preferred_contact: preferredContact,
    });

    const normalizedPhone = normalizePhoneFieldForApi(
      data.phoneNumber ?? user?.phone ?? "",
    );
    if (normalizedPhone === null) {
      showMessage({
        message: "Action Failed",
        description: "phone must be a valid US or international phone number.",
        type: "danger",
        icon: "danger",
      });
      return;
    }

    const normalizedWhatsapp = normalizePhoneFieldForApi(
      data.whatsappNumber ?? user?.whatsapp ?? "",
    );
    if (normalizedWhatsapp === null) {
      showMessage({
        message: "Action Failed",
        description: "whatsapp must be a valid US or international phone number.",
        type: "danger",
        icon: "danger",
      });
      return;
    }

    const authenticatedUserId = String(user?.sub ?? user?.uid ?? user?.id ?? '').trim();
    const authenticatedGymId = String(user?.gym_id ?? data.gymId ?? '').trim();

    if (!authenticatedUserId || !authenticatedGymId) {
      showMessage({
        message: "Action Failed",
        description: "Unable to determine the authenticated user or gym.",
        type: "danger",
        icon: "danger",
      });
      return;
    }

    formData.append("gym_id", authenticatedGymId);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("data.confirmPassword", data.confirmPassword);
    formData.append("role", normalizeRole(data.role));
    formData.append("fname", data.fname);
    formData.append("lname", data.lname);
    formData.append("date_of_birth", data.dateOfBirth);
    formData.append("sex", normalizedSex);
    formData.append("phone", normalizedPhone);
    formData.append("whatsapp", normalizedWhatsapp);
    formData.append("preferred_contact", preferredContact);
    formData.append("profilePic", {
      uri: data.profilePic?.path || data.profilePic?.uri,
      type: data.profilePic?.mime || data.profilePic?.type || "image/png",
      name: data.profilePic?.filename || data.profilePic?.name || "profile-photo.png",
    } as any);

    const response = await fetch(
      `${webServer}/api/v1/gyms/${authenticatedGymId}/users/${authenticatedUserId}`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + tokens.access_token,
        },
        body: formData,
      },
    );

    const json = await response.text();
    let obj: any = {};
    if (json) {
      try {
        obj = JSON.parse(json);
      } catch {
        obj = { message: json };
      }
    }

    if (response.ok) {
      showMessage({
        message: obj?.message,
        type: "success",
        autoHide: true, // prevents the message from disappearing automatically
        onPress: () => hideMessage(), // closes the message when pressed
      });
      return;
    }

    const responseMessage = String(obj?.message || obj?.error || 'Unable to update profile.').trim();

    if (response.status === 401 && /expired|invalid/i.test(responseMessage)) {
      const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
        method: "POST",
        body: JSON.stringify({
          token: tokens.refresh_token,
        }),
      });

      const refreshJson = await refreshResponse.text();
      let refreshObj: any = {};
      if (refreshJson) {
        try {
          refreshObj = JSON.parse(refreshJson);
        } catch {
          refreshObj = {};
        }
      }

      if (refreshResponse.status == 200) {
        setTokens({
          ...tokens,
          access_token: refreshObj.access_token,
          refresh_token: refreshObj.refresh_token,
        });
        showMessage({
          message: "Session refreshed",
          description: "Please try saving your profile again.",
          type: "info",
          autoHide: true,
        });
        return;
      }
    }

    showMessage({
      message: response.status === 403 ? "Forbidden" : "Action Failed",
      description: responseMessage,
      type: "danger",
      icon: "danger",
      autoHide: false,
    });
  };

  return (
    <>
      <View style={styles.fieldset}>
        <View style={styles.field}>
          <Controller
            control={control}
            name="profilePic"
            render={({ field: { onChange, value } }) => {
              const selectedProfilePicUri =
                (value as any)?.path ||
                (value as any)?.uri ||
                profilePicAPIImage ||
                // user?.profile_picture_url ||
                // user?.user_picture_url ||
                "";

              return (
                <View style={styles.imageContainer}>
                  {/* <Text style={styles.formLabel}>Profile Photo</Text> */}
                  <TouchableOpacity onPress={() => selectImage(onChange)} style={styles.imagePickerButton}>
                    {selectedProfilePicUri ? (
                      <Image source={{ uri: selectedProfilePicUri }} style={styles.avatar} resizeMode="cover" />
                    ) : (
                      <Image source={require("../../assets/images/avatars/profile-img.png")} style={styles.avatar} resizeMode="cover" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.helperText}>Choose a photo from your gallery or pick an avatar below.</Text>
                  <View style={styles.avatarGrid}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {localAvatarOptions.map((avatar) => (
                        <TouchableOpacity
                          key={avatar.key}
                          onPress={() => selectLocalAvatar(avatar, onChange)}
                          style={styles.avatarOption}
                        >
                          <Image source={avatar.asset} style={styles.avatarOptionImage} resizeMode="cover" />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              );
            }}
          />
          {errors.profilePic && (
            <Text style={styles.errorText}>{errors.profilePic.message}</Text>
          )}
        </View>
        <View style={[styles.field, { opacity: 0.5 }]} pointerEvents="none">
          <Text style={styles.formLabel}>E-mail</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
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
        <View
          style={[styles.field, { opacity: 0.5 }]}
          pointerEvents="none"
        >
          <Text style={styles.formLabel}>Role</Text>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, onBlur, value } }) => {
              const selectedRole = findRoleOption(value || user.role);

              return (
                <SelectList
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
        {/* Include the honeypot trap in your form */}
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
        <View
          style={[styles.field, { opacity: 0.5 }]}
          pointerEvents="none"
        >
          <Text style={styles.formLabel}>Sex</Text>
          <Controller
            name="sex"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => {
              const selectedSex = sexData.find(
                (item) => item.value === (value || user.gender),
              );

              return (
                <SelectList
                  setSelected={(val) => onChange(val)} // Send selection to hook-form
                  data={sexData}
                  save="value"
                  defaultOption={
                    selectedSex
                      ? { key: selectedSex.key, value: selectedSex.value }
                      : undefined
                  }
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
              );
            }}
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
                key={`phone-${phoneDefaultValue}`}
                defaultCode="US"
                defaultValue={phoneDefaultValue}
                value={value ?? phoneDefaultValue}
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
                key={`whatsapp-${whatsappDefaultValue}`}
                defaultCode="US"
                defaultValue={whatsappDefaultValue}
                value={value ?? whatsappDefaultValue}
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
            render={({ field: { onChange, value } }) => (
              <PreferredContact onSelectValue={onChange} value={value} />
            )}
          />
          {errors.preferredContact && (
            <Text style={styles.errorText}>
              {errors.preferredContact.message}
            </Text>
          )}
        </View>
        <View
          style={[styles.field, { opacity: 0.5 }]}
          pointerEvents="none"
        >
          <Text style={styles.formLabel}>Gym Location / Fitness Center</Text>
          <Controller
            control={control}
            name="gymId"
            render={({ field: { onChange } }) => (
              <GymList onSelectValue={onChange} />
            )}
          />
          {errors.gymId && (
            <Text style={styles.errorText}>{errors.gymId.message}</Text>
          )}
        </View>

        <View style={globalStyles.loginBtnContainer}>
          <TouchableOpacity
            style={globalStyles.registerBtn}
            onPress={handleSubmit((data) => updateUser(data))}
          >
            <Text style={globalStyles.registerBtnText}>Save Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={globalStyles.loginBtn}
            onPress={handleDeletePress}
          >
            <Text style={globalStyles.loginBtnText}>Delete Profile</Text>
          </TouchableOpacity>

        </View>
      </View>
    </>
  );
};

export default ProfileScreenForm;
