import { useState, useEffect, useRef, useContext } from "react";
import { Alert, Button } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import ImagePicker from "react-native-image-crop-picker";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { AppColors } from "../../styles/colors";
import { SelectList } from "react-native-dropdown-select-list";
import { UserContext } from "../../context/UserContext";
import HoneypotField from "./input_fields/HoneypotField";
import PreferredContact from "./PreferredContact";
import GymList from "../GymList";
import { globalStyles } from "../../styles/globalStyles";
import FlashMessage, {
  showMessage,
  hideMessage,
} from "react-native-flash-message";

// ============================================================================
// CONSTANTS & VALIDATION SCHEMA (Outside Component)
// ============================================================================

const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

const MIN_SUBMISSION_TIME_MS = 2000; // 5 seconds threshold before reg form can be submitted
const MAX_PROFILE_PIC_BYTES = 5 * 1024 * 1024;

const schema = yup.object().shape({
  // Define the Yup validation schema
  profilePic: yup
    .mixed()
    .test("required", "A profile picture is required", (value: any) => {
      if (!value) return false;
      return Boolean(value.path || value.uri || value.filename || value.mime || value.type);
    })
    .test("fileSize", "Image is too large (max 5MB)", (value: any) => {
      if (!value) return true;
      const fileSize = value.fileSize ?? value.size;
      if (!fileSize) return true;
      return fileSize <= MAX_PROFILE_PIC_BYTES;
    })
    .test("fileType", "A JPG or PNG profile picture is required", (value: any) => {
      if (!value) return false;
      if (value.isLocalAvatar) return true;
      const filename = (value.filename || value.path || value.uri || "").toLowerCase();
      return filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png");
    }),
  email: yup.string().required("Email is required").email("Invalid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(12, "Password must contain at least 12 characters")
    .matches(
      /^[a-zA-Z0-9\s~!@#$%^&*()_+-]+$/,
      "Only letters, numbers, spaces, hyphens, and underscores are allowed",
    ),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
  role: yup.string(), //.required().oneOf(["Owner", "Member", "Trainer", "Contractor"]),
  fname: yup.string().required("First name is required").min(2).max(20),
  lname: yup.string().required("Last name is required").min(2).max(20),
  dateOfBirth: yup
    .string()
    .matches(
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
      "Date must be in YYYY-MM-DD format",
    )
    .required("Date of birth is required"),
  sex: yup.string(),
  // .oneOf(["Male", "Female", "Other"], "Please select a valid category")
  // .required("Category selection is required"),
  phoneNumber: yup
    .string()
    .matches(phoneRegExp, "Phone Number is not valid")
    // .nullable()
    // .notRequired()
    .transform((value) => (value === "" ? "" : value)),
  whatsappNumber: yup
    .string()
    .matches(phoneRegExp, "WhatsApp Number number is not valid")
    .nullable()
    .notRequired()
    .transform((value) => (value === "" ? null : value)),
  preferredContact: yup.string(), // .oneOf(["Phone", "Email", "WhatsApp"]),
  gymId: yup.string().matches(/^\d+$/, "Gym location is required"),
  // .required("Category selection is required"),
});

//
//
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

const localAvatarOptions = [
  { key: "avatar-1", name: "beard-hipster-male.png", asset: require("../../assets/images/avatars/beard-hipster-male.png") },
  { key: "avatar-2", name: "boy-indian-kid.png", asset: require("../../assets/images/avatars/boy-indian-kid.png") },
  { key: "avatar-3", name: "boy-kid.png", asset: require("../../assets/images/avatars/boy-kid.png") },
  { key: "avatar-4", name: "boy-male.png", asset: require("../../assets/images/avatars/boy-male.png") },
  { key: "avatar-5", name: "indian-male-man.png", asset: require("../../assets/images/avatars/indian-male-man.png") },
  { key: "avatar-6", name: "indian-man-sikh.png", asset: require("../../assets/images/avatars/indian-man-sikh.png") },
  { key: "avatar-7", name: "person-pilot.png", asset: require("../../assets/images/avatars/person-pilot.png") },
];

// ============================================================================
// COMPONENT
// ============================================================================

const ProfileScreenForm = () => {
  const { user, setUser } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const [website, setWebsite] = useState("");
  const { webServer } = useContext(UserContext);
  const [profilePicAPIImage, setProfilePicAPIImage] = useState<string>(""); // State to hold the selected image

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
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    shouldFocusError: true, // Automatically moves focus and triggers internal scrolling layout
    defaultValues: {
      profilePic: undefined,
      email: user?.email,
      password: "pppppppppppp",
      confirmPassword: "pppppppppppp",
      role: user?.role,
      fname: user?.given_name,
      lname: user?.family_name,
      dateOfBirth: '',
      sex: user?.gender,
      phoneNumber: '',
      whatsappNumber: '',
      gymId: user?.gym_id,
    },
  });

  // Watch profilePic to display it
  const profilePicValue = watch("profilePic");

  // Reset the timer if the user navigates back to this screen
  useEffect(() => {
    formLoadTime.current = Date.now();
    const fetchUserData = async ({ tokens, webServer, user, setTokens }) => {
      const response = await fetch(`${webServer}/api/v1/users/${user.sub}`, {
        headers: {
          Authorization: "Bearer " + tokens.access_token,
        },
      });
      const json = await response.text();
      const obj = JSON.parse(json);

      if (response.status == 200) {
        // console.log('obj: ', obj)
        //set profile fields here on success
        reset({
          dateOfBirth: obj.profile_fields.date_of_birth,
          phoneNumber: obj.profile_fields.phone,
          preferredContact: obj.profile_fields.preferred_contact,
          whatsappNumber: obj.profile_fields.whatsapp,
          profilePic: obj.profile_fields.user_picture_url ? { path: 'http://localhost:8080/classy-api/api/' + obj.profile_fields.user_picture_url } : {},
        });
        setProfilePicAPIImage('http://localhost:8080/classy-api/api/' + obj.profile_fields.user_picture_url);
      } else {
        console.log("Access token expired, requesting new one - useEffect()");

        const response = await fetch(`${webServer}/api/refresh.php`, {
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
    fetchUserData({ tokens, webServer, user, setTokens });
  }, [reset]); // Always include reset in the dependency array

  const executeProfileDeletion = async ({ tokens, webServer, user, setTokens }) => {
    console.log("Profile deletion API initiated.");

    const response = await fetch(
      `${webServer}/api/delete-profile.php`,
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
      // showMessage({
      //   message: obj?.message,
      //   type: "success",
      //   autoHide: false, // prevents the message from disappearing automatically
      //   onPress: () => hideMessage(), // closes the message when pressed
      // });
      console.log('obj: ', obj);
    }
    else {
      console.log("Access token expired, requesting new one - executeProfileDeletion()");

      // const response = await fetch(`${webServer}/api/refresh.php`, {
      //   method: "POST",
      //   body: JSON.stringify({
      //     token: tokens.refresh_token,
      //   }),
      // });

      // const json = await response.text();
      // const obj = JSON.parse(json);

      // if (response.status == 200) {
      //   console.log("Got new access token and refresh token");
      //   setTokens({
      //     ...tokens,
      //     access_token: obj.access_token,
      //     refresh_token: obj.refresh_token,
      //   });
      // }
    }
  };

  const executeGymMembershipCancellation = () => {
    console.log("Gym Membership Cancellation API initiated.");
    // Insert your Axios, Fetch, or Firebase deletion request here
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

  const handleCancelGymMembershipPress = () => {
    Alert.alert(
      "Cancel Gym Membership", // Dialog Title
      "Are you absolutely sure? You are about to cancel your gym membership", // Dialog Description
      [
        {
          text: "Cancel",
          onPress: () => console.log("Deletion cancelled"),
          style: "cancel", // Stylizes text as a neutral cancel action
        },
        {
          text: "Cancel Gym Membership",
          onPress: () => executeGymMembershipCancellation(),
          style: "destructive", // Colors the font red on iOS platforms
        },
      ],
      { cancelable: true }, // Allows Android users to dismiss by clicking background
    );
  };

  // 3. Define the submit handler
  const updateUser = async (data: any) => {
    console.log('data: ' + JSON.stringify(data));
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

    // Set submitted values within app before sending to API. No need to retreive from API
    setUser({
      ...user,
      given_name: data.fname,
      family_name: data.lname,
      preferred_contact: data.preferredContact,
    });

    formData.append("gym_id", data.gymId);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("data.confirmPassword", data.confirmPassword);
    formData.append("role", data.role);
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
    formData.append('profileUpdate', 'true');

    console.log("FormData ready for fetch:", JSON.stringify(formData));

    const response = await fetch(
      `${webServer}/api/register.php`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + tokens.access_token,
        },
        body: formData,
      },
    );

    const json = await response.text();
    const obj = JSON.parse(json);
    console.log(obj);

    if (response.status == 200) {
      showMessage({
        message: obj?.message,
        type: "success",
        autoHide: false, // prevents the message from disappearing automatically
        onPress: () => hideMessage(), // closes the message when pressed
      });
    } else {
      console.log("Access token expired, requesting new one - updateUser()");

      const response = await fetch(`${webServer}/api/refresh.php`, {
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

  return (
    <>
      <View style={styles.fieldset}>
        <View style={styles.field}>
          <Controller
            control={control}
            name="profilePic"
            render={({ field: { onChange, value } }) => {
              const selectedProfilePicUri = (value as any)?.path || (value as any)?.uri || profilePicAPIImage || "";

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
              const selectedRole = roleData.find(
                (item) => item.value === (value || user.role),
              );

              return (
                <SelectList
                  setSelected={(val) => onChange(val)} // Send selection to hook-form
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
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <TextInput
                ref={ref}
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
                placeholder="yyyy-mm-dd"
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
            render={({ field: { onChange } }) => (
              <PreferredContact onSelectValue={onChange} />
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
            title="loginSubmit"
            onPress={handleSubmit(updateUser)}
          >
            <Text style={globalStyles.registerBtnText}>Save Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={globalStyles.loginBtn}
            title="loginSubmit"
            onPress={handleDeletePress}
          >
            <Text style={globalStyles.loginBtnText}>Delete Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={globalStyles.loginBtn}
            title="loginSubmit"
            onPress={handleCancelGymMembershipPress}
          >
            <Text style={globalStyles.loginBtnText}>Cancel Gym Membership</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  imagePickerButton: {
    marginTop: 4,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
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
    margin: 4,
  },
  avatarOptionImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: AppColors.grey2,
  },
  field: {},
});
