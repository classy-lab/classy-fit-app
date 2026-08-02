import { useState, useRef, useContext, useCallback, useEffect } from "react";
import { Alert, Linking } from "react-native";
import { useForm, Controller, FieldErrors } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ImagePicker from "react-native-image-crop-picker";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from "../../styles/colors";
import Feather from "@expo/vector-icons/Feather";
import { SelectList } from "react-native-dropdown-select-list";
import { UserContext } from "../../context/UserContext";
import HoneypotField from "../../components/forms/input_fields/HoneypotField";
import PreferredContact from "../../components/forms/PreferredContact";
import { globalStyles } from "../../styles/globalStyles";
import {
  localAvatarOptions,
  MAX_PROFILE_PIC_BYTES,
  MIN_SUBMISSION_TIME_MS,
  createContactSchema as schema,
  sexData,
} from "../../components/forms/ProfileScreenForm.constants";
import PinkLeafSvg from "../../assets/svg/PinkLeafSvg";
import SignOut from "../../components/utils/SignOut";
import { styles } from "../../styles/registerFormStyles";
import FlashMessage, {
  showMessage,
  hideMessage,
} from "react-native-flash-message";


// ============================================================================
// COMPONENT
// ============================================================================

const AddContactScreen = ({ navigation }: { navigation: any }) => {
  const { user, setUser } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const [website, setWebsite] = useState("");
  const { webServer } = useContext(UserContext);
  const { setIsLoggedIn } = useContext(UserContext);
  const [profilePicAPIImage, setProfilePicAPIImage] = useState<string>(""); // State to hold the selected image
  const preferredContactOptions = [
    { key: "1", value: "Phone" },
    { key: "2", value: "WhatsApp" },
    { key: "3", value: "Email" },
  ];
  const getOptionValue = (options: any[], rawValue: any) => {
    return options.find(
      (item) => item.key === String(rawValue) || item.value === rawValue,
    )?.value ?? (rawValue || "");
  };

  const handleLinkPress = () => {
    Linking.openURL("https://cleancodeusa.com/about.html");
  };

  // console.log("UpdateContactForm contact prop:", contact);
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
        filename: profilePic.filename || "profilePic.jpg",
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
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    shouldFocusError: true, // Automatically moves focus and triggers internal scrolling layout
    defaultValues: {
      profilePic: undefined,
      email: "",
      fname: "",
      lname: "",
      company: "",
      job: "",
      sex: '',
      phoneNumber: '',
      whatsappNumber: '',
      preferredContact: '',
      gymId: '',
    },
  });

  // Watch profilePic to display it
  const profilePicValue = watch("profilePic");

  useEffect(() => {
    setValue("gymId", String(user?.gym_id), { shouldValidate: true });
  }, []);

  const createContact = async (data: any) => {
    console.log('data: ' + JSON.stringify(data));
    const totalTimeElapsed = Date.now() - formLoadTime.current;
    const formData = new FormData();
    const emailValue = (data?.email ?? "").trim();
    const fnameValue = (data?.fname ?? "").trim();
    const sexValue = getOptionValue(sexData, data?.sex);
    const preferredContactValue = getOptionValue(preferredContactOptions, data?.preferredContact);

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

    // formData.append("uid", contact?.uid);
    formData.append("gym_id", data.gymId || user.gym_id);
    formData.append("email", emailValue);
    formData.append("fname", fnameValue);
    formData.append("lname", data.lname);
    formData.append("company", data.company);
    formData.append("job", data.job);
    formData.append("sex", sexValue);
    formData.append("phone", data.phoneNumber);
    formData.append("whatsapp", data.whatsappNumber);
    formData.append("preferred_contact", preferredContactValue);

    const profilePicPayload = data.profilePic
      ? {
        uri: data.profilePic?.path || data.profilePic?.uri,
        type: data.profilePic?.mime || data.profilePic?.type || "image/png",
        name: data.profilePic?.filename || data.profilePic?.name || "profilePic.png",
      }
      : profilePicAPIImage || "";

    formData.append("profilePic", profilePicPayload as any);

    console.log("FormData ready for fetch:", JSON.stringify(formData));

    try {
      const response = await fetch(
        `${webServer}/api/v1/gyms/${user.gym_id}/contacts`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + tokens.access_token,
          },
          body: formData,
        },
      );

      const rawBody = await response.text();
      let obj: any = null;

      try {
        obj = rawBody ? JSON.parse(rawBody) : null;
      } catch (parseError) {
        console.log("Update contact response is not valid JSON:", parseError);
      }

      if (response.status === 200) {
        showMessage({
          message: obj?.message || "Contact updated successfully.",
          type: "success",
          autoHide: true, // prevents the message from disappearing automatically
          onPress: () => hideMessage(), // closes the message when pressed
        });
      } else {
        console.log("Update contact failed", {
          status: response.status,
          body: obj || rawBody,
        });

        const refreshResponse = await fetch(`${webServer}/api/refresh.php`, {
          method: "POST",
          body: JSON.stringify({
            token: tokens.refresh_token,
          }),
        });

        const refreshJson = await refreshResponse.text();
        const refreshObj = JSON.parse(refreshJson);

        if (refreshResponse.status === 200) {
          console.log("Got new access token and refresh token");
          setTokens({
            ...tokens,
            access_token: refreshObj.access_token,
            refresh_token: refreshObj.refresh_token,
          });
        }
      }
    } catch (error) {
      console.log("Update contact request failed", error);
    }
  };

  const handleSubmitErrors = (formErrors: FieldErrors<any>) => {
    console.log("Save Contact blocked by validation:", formErrors);
  };

  const handleSaveContactPress = () => {
    console.log("Save Contact button pressed");
    handleSubmit(createContact, handleSubmitErrors)();
  };

  return (
    <>
      <SafeAreaView style={layoutStyles.container}>
        <View style={layoutStyles.navs}>
          <Feather
            name="arrow-left"
            color={AppColors.blue}
            size={36}
            onPress={() => {
              navigation.goBack();
            }}
          />
          <View style={layoutStyles.rightActions}>
            <SignOut />
          </View>
        </View>
        <ScrollView
          style={layoutStyles.scrollView}
          contentContainerStyle={layoutStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={layoutStyles.headingContainer}>
            <Text style={layoutStyles.title}>Add Contact</Text>
            <PinkLeafSvg style={layoutStyles.pinkLeaf} />
          </View>
          <View style={layoutStyles.body}>
            <View style={layoutStyles.fieldset}>
              <View style={layoutStyles.field}>
                <Controller
                  control={control}
                  name="profilePic"
                  render={({ field: { onChange, value } }) => {
                    const selectedProfilePicUri = (value as any)?.path || (value as any)?.uri || "";

                    return (
                      <View style={styles.imageContainer}>
                        <TouchableOpacity onPress={() => selectImage(onChange)} style={styles.imagePickerButton}>
                          {selectedProfilePicUri ? (
                            <Image source={{ uri: selectedProfilePicUri }} style={styles.avatar} resizeMode="cover" />
                          ) : (
                            <Image source={require("../../assets/images/avatars/profile-img.png")} style={styles.avatar} resizeMode="cover" />
                          )}
                        </TouchableOpacity>
                        <Text style={styles.helperText}>Choose a photo from your gallery.</Text>
                        <Text style={styles.helperText}>Max size: 5 MB. Allowed formats: JPG, JPEG, PNG.</Text>
                      </View>
                    );
                  }}
                />
                {errors.profilePic && <Text style={styles.errorText}>{errors.profilePic.message}</Text>}
              </View>

              <View style={layoutStyles.field}>
                <Text style={styles.formLabel}>First Name</Text>
                <Controller
                  control={control}
                  name="fname"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextInput
                      ref={ref}
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value ?? ""}
                      keyboardType="default"
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.fname && <Text style={styles.errorText}>{errors.fname.message}</Text>}
              </View>

              <View style={layoutStyles.field}>
                <Text style={styles.formLabel}>Last Name</Text>
                <Controller
                  control={control}
                  name="lname"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextInput
                      ref={ref}
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="default"
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.lname && <Text style={styles.errorText}>{errors.lname.message}</Text>}
              </View>

              <View style={layoutStyles.field}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <Controller
                  control={control}
                  name="phoneNumber"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextInput
                      ref={ref}
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
                {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>}
              </View>

              <View style={layoutStyles.field}>
                <Text style={styles.formLabel}>Sex</Text>
                <Controller
                  name="sex"
                  control={control}
                  render={({ field: { onChange, value } }) => {
                    const selectedSex = sexData.find(
                      (item) => item.key === String(value) || item.value === value,
                    );

                    return (
                      <SelectList
                        setSelected={(selectedValue) => onChange(selectedValue)}
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
                      />
                    );
                  }}
                />
                {errors.sex && <Text style={styles.errorText}>{errors.sex.message}</Text>}
              </View>

              <View style={layoutStyles.field}>
                <Text style={styles.formLabel}>Company</Text>
                <Controller
                  control={control}
                  name="company"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextInput
                      ref={ref}
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="default"
                      autoCapitalize="words"
                    />
                  )}
                />
                {errors.company && <Text style={styles.errorText}>{errors.company.message}</Text>}
              </View>

              <View style={layoutStyles.field}>
                <Text style={styles.formLabel}>Job</Text>
                <Controller
                  control={control}
                  name="job"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <TextInput
                      ref={ref}
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="default"
                      autoCapitalize="words"
                    />
                  )}
                />
                {errors.job && <Text style={styles.errorText}>{errors.job.message}</Text>}
              </View>

              <HoneypotField value={website} onChangeText={setWebsite} />

              <View style={layoutStyles.field}>
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
                {errors.whatsappNumber && <Text style={styles.errorText}>{errors.whatsappNumber.message}</Text>}
              </View>

              <View style={layoutStyles.field}>
                <Text style={styles.formLabel}>E-mail</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.inputField}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value ?? ""}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </View>

              <View style={layoutStyles.field}>
                <Text style={styles.formLabel}>Preferred Contact</Text>
                <Controller
                  control={control}
                  name="preferredContact"
                  render={({ field: { onChange, value } }) => (
                    <PreferredContact onSelectValue={onChange} value={value} />
                  )}
                />
                {errors.preferredContact && <Text style={styles.errorText}>{errors.preferredContact.message}</Text>}
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
                  onPress={handleSaveContactPress}
                >
                  <Text style={styles.loginBtnText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default AddContactScreen;

const layoutStyles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  navs: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
  },
  headingContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    color: AppColors.blue,
    fontSize: 32,
    marginTop: 20,
    marginBottom: 40,
    width: 320,
    textAlign: "center",
  },
  pinkLeaf: {
    position: "absolute",
    zIndex: -1,
    right: 96,
  },
  body: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  fieldset: {
  },
});
