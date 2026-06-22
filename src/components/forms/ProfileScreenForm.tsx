import { useState, useEffect, useRef, useContext } from "react";
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ImageSourcePropType,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import ImagePicker from "react-native-image-crop-picker";
import { AppColors } from "../../styles/colors";
import { SelectList } from "react-native-dropdown-select-list";
import { UserContext } from "../../context/UserContext";
import HoneypotField from "./input_fields/HoneypotField";
import PreferredContact from "./PreferredContact";
import GymList from "../GymList";
import { globalStyles } from "../../styles/globalStyles";
import FlashMessage, { showMessage, hideMessage } from "react-native-flash-message";

// ============================================================================
// VALIDATION, CONSTANTS
// ============================================================================

const phoneRegExp =
  /^((\+[1-9]{1,4}[ \-]*)|(\([0-9]{2,3}\)[ \-]*)|([0-9]{2,4})[ \-]*)*?[0-9]{3,4}?[ \-]*[0-9]{3,4}?$/;

const MIN_SUBMISSION_TIME_MS = 2000;

const schema = yup.object().shape({
  // Define the Yup validation schema
  profilePic: yup
    .mixed()
    .required("A profile picture is required")
    .test("fileSize", "Image is too large (max 5MB)", (value: any) => {
      if (!value || !value.fileSize) return true;
      return value.fileSize <= 5 * 1024 * 1024;
    })
    .test("fileType", "A JPG or PNG profile picture is required", (value: any) => {
      if (!value) return false;
      const validExtensions = [".jpg", ".jpeg", ".png"];
      const filename = (value.filename || "").toString().toLowerCase();
      const path = (value.path || "").toString().toLowerCase();
      return validExtensions.some((ext) => filename.endsWith(ext) || path.endsWith(ext));
    }),
  email: yup.string().required("Email is required").email("Invalid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(12, "Password must contain at least 12 characters")
    .matches(/^[a-zA-Z0-9\s~!@#$%^&*()_+\-]+$/, "Only letters, numbers, spaces, hyphens, and underscores are allowed"),
  confirmPassword: yup.string().oneOf([yup.ref("password")], "Passwords must match").required("Please confirm your password"),
  role: yup.string(),
  fname: yup.string().required("First name is required").min(2).max(20),
  lname: yup.string().required("Last name is required").min(2).max(20),
  dateOfBirth: yup.string().matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Date must be in YYYY-MM-DD format").required("Date of birth is required"),
  sex: yup.string(),
  phoneNumber: yup.string().matches(phoneRegExp, "Phone Number is not valid").transform((value) => (value === "" ? "" : value)),
  whatsappNumber: yup.string().matches(phoneRegExp, "WhatsApp Number number is not valid").nullable().notRequired().transform((value) => (value === "" ? null : value)),
  preferredContact: yup.string(),
  gymId: yup.string().matches(/^\d+$/, "Gym location is required"),
});

// ============================================================================
// AVATARS (7) - local requires
// ============================================================================

const localAvatars: Record<string, ImageSourcePropType> = {
  avatar1: require("../../assets/images/avatars/boy-kid.png"),
  avatar2: require("../../assets/images/avatars/boy-male.png"),
  avatar3: require("../../assets/images/avatars/person-pilot.png"),
  avatar4: require("../../assets/images/avatars/beard-hipster-male.png"),
  avatar5: require("../../assets/images/avatars/boy-indian-kid.png"),
  avatar6: require("../../assets/images/avatars/indian-male-man.png"),
  avatar7: require("../../assets/images/avatars/indian-man-sikh.png"),
};

// Keep an ordered list of the 7 keys for rendering
const avatarKeys = ["avatar1", "avatar2", "avatar3", "avatar4", "avatar5", "avatar6", "avatar7"];

// ============================================================================
// Other constants
// ============================================================================

const sexData = [
  { key: "1", value: "Male", disabled: false },
  { key: "2", value: "Female" },
  { key: "3", value: "Other" },
];

const roleData = [
  { key: "1", value: "Owner", disabled: false },
  { key: "2", value: "Member" },
  { key: "3", value: "Trainer" },
  { key: "4", value: "Contractor" },
];

// ============================================================================
// COMPONENT
// ============================================================================

const ProfileScreenForm = () => {
  const { user, setUser } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const [website, setWebsite] = useState("");
  // Use localAvatars.avatar1 as default preview
  const [profileImageSource, setProfileImageSource] = useState<ImageSourcePropType>(localAvatars.avatar1);

  const formLoadTime = useRef(Date.now());

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
      profilePic: {},
      email: user?.email ?? "",
      password: "pppppppppppp",
      confirmPassword: "pppppppppppp",
      role: user?.role ?? "",
      fname: user?.given_name ?? "",
      lname: user?.family_name ?? "",
      dateOfBirth: "",
      sex: user?.gender ?? "",
      phoneNumber: "",
      whatsappNumber: "",
      gymId: user?.gym_id ?? "",
    },
  });

  const profilePicValue = watch("profilePic");

  useEffect(() => {
    formLoadTime.current = Date.now();
    const fetchUserData = async ({ tokens, webServer, user, setTokens }) => {
      try {
        const response = await fetch(`${webServer}/api/v1/users/${user.sub}`, {
          headers: { Authorization: "Bearer " + tokens.access_token },
        });
        const text = await response.text();
        const obj = JSON.parse(text);

        if (response.status === 200) {
          reset({
            dateOfBirth: obj.profile_fields.date_of_birth ?? "",
            phoneNumber: obj.profile_fields.phone ?? "",
            preferredContact: obj.profile_fields.preferred_contact ?? "",
            whatsappNumber: obj.profile_fields.whatsapp ?? "",
          });
        } else {
          const refreshRes = await fetch(`${webServer}/api/refresh.php`, { method: "POST", body: JSON.stringify({ token: tokens.refresh_token }) });
          const refreshText = await refreshRes.text();
          const refreshObj = JSON.parse(refreshText);
          if (refreshRes.status === 200) {
            setTokens({ ...tokens, access_token: refreshObj.access_token, refresh_token: refreshObj.refresh_token });
          }
        }
      } catch (err) {
        console.log("fetchUserData error:", err);
      }
    };
    if (user && tokens && webServer) fetchUserData({ tokens, webServer, user, setTokens });
  }, [reset, tokens, webServer, user, setTokens]);

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

      const filename = (profilePic.filename || "").toLowerCase();
      const path = (profilePic.path || "").toLowerCase();
      const allowed = [".jpg", ".jpeg", ".png"];
      const ok = allowed.some((ext) => filename.endsWith(ext) || path.endsWith(ext));
      if (!ok) {
        Alert.alert("Unsupported Format", "Please select a JPEG or PNG image.");
        return;
      }

      // set form value and preview
      onChange(profilePic);
      setProfileImageSource({ uri: profilePic.path });
    } catch (e) {
      console.log("Image picker error:", e);
    }
  };

  const executeProfileDeletion = () => {
    console.log("Profile deletion API initiated.");
  };
  const executeGymMembershipCancellation = () => {
    console.log("Gym Membership Cancellation API initiated.");
  };

  const handleDeletePress = () =>
    Alert.alert(
      "Delete Profile",
      "Are you absolutely sure? This action is permanent and your account cannot be recovered.",
      [
        { text: "Cancel", onPress: () => console.log("Deletion cancelled"), style: "cancel" },
        { text: "Delete My Account", onPress: () => executeProfileDeletion(), style: "destructive" },
      ],
      { cancelable: true },
    );

  const handleCancelGymMembershipPress = () =>
    Alert.alert(
      "Cancel Gym Membership",
      "Are you absolutely sure? You are about to cancel your gym membership",
      [
        { text: "Cancel", onPress: () => console.log("Deletion cancelled"), style: "cancel" },
        { text: "Cancel Gym Membership", onPress: () => executeGymMembershipCancellation(), style: "destructive" },
      ],
      { cancelable: true },
    );

  const updateUser = async (data: any) => {
    const totalTimeElapsed = Date.now() - formLoadTime.current;
    if (website.trim() !== "") {
      console.log("Submission failed", "Bot behavior detected.");
      return;
    }
    if (totalTimeElapsed < MIN_SUBMISSION_TIME_MS) {
      console.log("Submission failed", "Form submitted too quickly.");
      return;
    }

    setUser({
      ...user,
      given_name: data.fname,
      family_name: data.lname,
      preferred_contact: data.preferredContact,
    });

    const formData = new FormData();
    formData.append("gym_id", data.gymId ?? "");
    formData.append("email", data.email ?? "");
    formData.append("password", data.password ?? "");
    formData.append("data.confirmPassword", data.confirmPassword ?? "");
    formData.append("role", data.role ?? "");
    formData.append("fname", data.fname ?? "");
    formData.append("lname", data.lname ?? "");
    formData.append("date_of_birth", data.dateOfBirth ?? "");
    formData.append("sex", data.sex ?? "");
    formData.append("phone", data.phoneNumber ?? "");
    formData.append("whatsapp", data.whatsappNumber ?? "");
    formData.append("preferred_contact", data.preferredContact ?? "");
    if (data.profilePic && data.profilePic.path) {
      formData.append("profilePic", {
        uri: data.profilePic.path,
        type: data.profilePic.mime || "image/jpeg",
        name: data.profilePic.filename || "profile.jpg",
      } as any);
    }
    formData.append("profileUpdate", "true");

    try {
      const response = await fetch(`${webServer}/api/register.php`, {
        method: "POST",
        headers: { Authorization: "Bearer " + tokens.access_token },
        body: formData,
      });
      const text = await response.text();
      const obj = JSON.parse(text);
      if (response.status === 200) {
        showMessage({ message: obj?.message || "Profile updated", type: "success", autoHide: true, onPress: () => hideMessage() });
      } else {
        const refreshRes = await fetch(`${webServer}/api/refresh.php`, { method: "POST", body: JSON.stringify({ token: tokens.refresh_token }) });
        const refreshText = await refreshRes.text();
        const refreshObj = JSON.parse(refreshText);
        if (refreshRes.status === 200) {
          setTokens({ ...tokens, access_token: refreshObj.access_token, refresh_token: refreshObj.refresh_token });
        } else {
          showMessage({ message: obj?.message || "Failed to update profile", type: "danger" });
        }
      }
    } catch (err) {
      console.log("updateUser error:", err);
      showMessage({ message: "Network error", type: "danger" });
    }
  };

  return (
    <>
      <View style={styles.fieldset}>
        <View style={styles.field}>
          <Controller
            control={control}
            name="profilePic"
            render={({ field: { onChange, value } }) => (
              <View style={styles.imageContainer}>
                {/* Main preview: uploaded image (value.path) takes precedence, otherwise preview from local avatar */}
                <TouchableOpacity onPress={() => selectImage(onChange)}>
                  {value && value.path ? (
                    <Image source={{ uri: value.path }} style={{ width: 80, height: 80, borderRadius: 20 }} />
                  ) : (
                    <Image source={profileImageSource} style={{ width: 80, height: 80, borderRadius: 20 }} />
                  )}
                </TouchableOpacity>

                {/* Always show avatar thumbnails so user can choose one of 7 */}
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
                  <View style={styles.avatarscrollContainer}>
                    {avatarKeys.map((key) => {
                      const src = localAvatars[key];
                      return (
                        <TouchableOpacity
                          key={key}
                          style={{ marginHorizontal: 6 }}
                          onPress={() => {
                            // Update preview
                            setProfileImageSource(src);
                            // Update form value with a shape the backend/upload expects
                            const resolved = Image.resolveAssetSource(src);
                            onChange({
                              path: resolved.uri,
                              filename: `${key}.png`,
                              mime: "image/png",
                            });
                          }}
                        >
                          <Image source={src} style={styles.avatar} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Small hint */}
                <Text style={{ fontSize: 12, marginTop: 8, color: AppColors.primary }}>
                  Tap preview to upload from gallery, or choose an avatar.
                </Text>
              </View>
            )}
          />
          {errors.profilePic && <Text style={styles.errorText}>{errors.profilePic.message}</Text>}
        </View>

        {/* -- rest of form fields unchanged -- */}

        <View style={[styles.field, { opacity: 0.5 }]} pointerEvents="none">
          <Text style={styles.formLabel}>E-mail</Text>
          <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.inputField} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="email-address" autoCapitalize="none" />} />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Password</Text>
          <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.inputField} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="default" secureTextEntry />} />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Confirm Password</Text>
          <Controller control={control} name="confirmPassword" render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.inputField} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="default" secureTextEntry />} />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
        </View>

        <View style={[styles.field, { opacity: 0.5 }]} pointerEvents="none">
          <Text style={styles.formLabel}>Role</Text>
          <Controller control={control} name="role" render={({ field: { onChange } }) => <SelectList setSelected={(val) => onChange(val)} data={roleData} save="value" placeholder="Select Category" defaultOption={{ key: "1", value: user?.role ?? "" }} boxStyles={{ borderColor: AppColors.grey, borderWidth: 1, paddingHorizontal: 8 }} dropdownStyles={{ borderColor: AppColors.grey2, borderWidth: 1, marginTop: 8, backgroundColor: "white" }} />} />
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>First Name</Text>
          <Controller control={control} name="fname" render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.inputField} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="default" autoCapitalize="none" />} />
          {errors.fname && <Text style={styles.errorText}>{errors.fname.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Last Name</Text>
          <Controller control={control} name="lname" render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.inputField} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="default" autoCapitalize="none" />} />
          {errors.lname && <Text style={styles.errorText}>{errors.lname.message}</Text>}
        </View>

        <HoneypotField value={website} onChangeText={setWebsite} />

        <View style={styles.field}>
          <Text style={styles.formLabel}>Date of Birth</Text>
          <Controller control={control} name="dateOfBirth" render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.inputField} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="default" autoCapitalize="none" placeholder="yyyy-mm-dd" />} />
          {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>}
        </View>

        <View style={[styles.field, { opacity: 0.5 }]} pointerEvents="none">
          <Text style={styles.formLabel}>Sex</Text>
          <Controller name="sex" control={control} render={({ field: { onChange } }) => <SelectList setSelected={(val) => onChange(val)} data={sexData} save="value" defaultOption={{ key: "1", value: user?.gender ?? "" }} placeholder="Select Category" boxStyles={{ borderColor: AppColors.grey, borderWidth: 1, paddingHorizontal: 8 }} dropdownStyles={{ borderColor: AppColors.grey2, borderWidth: 1, marginTop: 8, backgroundColor: "white" }} />} />
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Phone Number</Text>
          <Controller control={control} name="phoneNumber" render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.inputField} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="default" autoCapitalize="none" placeholder="518-555-5555" />} />
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>WhatsApp Number</Text>
          <Controller control={control} name="whatsappNumber" render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.inputField} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="default" placeholder="518-555-5555" autoCapitalize="none" />} />
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Preferred Contact</Text>
          <Controller control={control} name="preferredContact" render={({ field: { onChange } }) => <PreferredContact onSelectValue={onChange} />} />
        </View>

        <View style={[styles.field, { opacity: 0.5 }]} pointerEvents="none">
          <Text style={styles.formLabel}>Gym Location / Fitness Center</Text>
          <Controller control={control} name="gymId" render={({ field: { onChange } }) => <GymList onSelectValue={onChange} />} />
        </View>

        <View style={globalStyles.loginBtnContainer}>
          <TouchableOpacity style={globalStyles.registerBtn} onPress={handleSubmit(updateUser)}>
            <Text style={globalStyles.registerBtnText}>Save Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={globalStyles.loginBtn} onPress={handleDeletePress}>
            <Text style={globalStyles.loginBtnText}>Delete Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={globalStyles.loginBtn} onPress={handleCancelGymMembershipPress}>
            <Text style={globalStyles.loginBtnText}>Cancel Gym Membership</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlashMessage position="top" />
    </>
  );
};

export default ProfileScreenForm;

const styles = StyleSheet.create({
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
  errorText: {
    color: AppColors.red,
  },
  imageContainer: { alignItems: "center", marginBottom: 8 },
  avatar: {
    width: 48,
    height: 48,
    // borderRadius: 32,
  },
  field: {},
  avatarscrollContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
});
