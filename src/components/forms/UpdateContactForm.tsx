import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert } from "react-native";
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


// ============================================================================
// COMPONENT
// ============================================================================

const UpdateContactForm = ({ navigation, contact }: { navigation: any; contact: any }) => {
  const { user, setUser } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const [website, setWebsite] = useState("");
  const { webServer } = useContext(UserContext);
  const { setIsLoggedIn } = useContext(UserContext);
  const [profilePicAPIImage, setProfilePicAPIImage] = useState<string>(""); // State to hold the selected image

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
        filename: profilePic.filename || "gallery-photo.png",
        fileSize,
      });
    } catch (e) {
      console.log(e);
    }
  };

  // const selectLocalAvatar = (avatar: any, onChange: (value: any) => void) => {
  //   const resolved = Image.resolveAssetSource(avatar.asset);
  //   onChange({
  //     uri: resolved.uri,
  //     path: resolved.uri,
  //     mime: "image/png",
  //     filename: avatar.name,
  //     type: "image/png",
  //     isLocalAvatar: true,
  //   });
  // };

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
      email: contact.email, // user?.email,
      password: "",
      confirmPassword: "",
      role: contact.role || '', //normalizeRole(user?.role),
      fname: contact.fname || '', // user?.given_name,
      lname: contact.lname || '', // user?.family_name,
      dateOfBirth: contact.dateOfBirth || '',
      sex: '', // user?.gender,
      phoneNumber: '',
      whatsappNumber: '',
      gymId: '', // user?.gym_id,
    },
  });

  // Watch profilePic to display it
  const profilePicValue = watch("profilePic");

  useFocusEffect(
    useCallback(() => {
      // let isActive = true;

      const fetchUserData = async () => {
        // if (!user?.gym_id || !tokens?.access_token || !contact?.uid) {
        //   return;
        // }

        try {
          const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/contacts/${contact.uid}`, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });

          const json = await response.text();
          const obj = JSON.parse(json);

          if (response.status === 200) {
            const contactData = obj?.contact ?? obj?.data ?? obj;
            console.log(response.status, "Fetched contact data:", contactData);

            reset({
              email: contactData?.email ?? contact?.email ?? "",
              password: "",
              confirmPassword: "",
              role: contactData?.role ?? contact?.role ?? "",
              fname: contactData?.fname ?? contact?.fname ?? "",
              lname: contactData?.lname ?? contact?.lname ?? "",
              dateOfBirth: contactData?.date_of_birth ?? contact?.dateOfBirth ?? "",
              sex: contactData?.sex ?? "",
              phoneNumber: contactData?.phone ?? "",
              whatsappNumber: contactData?.whatsapp ?? "",
              gymId: contactData?.gym_id ?? "",
              preferredContact: contactData?.preferred_contact ?? "",
              profilePic: undefined,
            });

            const picturePath = contactData?.user_picture_url || contactData?.user_profile_url;
            setProfilePicAPIImage(picturePath ? `${webServer}/api/${picturePath}` : "");
          } else {
            const refreshResponse = await fetch(`${webServer}/api/refresh.php`, {
              method: "POST",
              body: JSON.stringify({
                token: tokens.refresh_token,
              }),
            });

            const refreshJson = await refreshResponse.text();
            const refreshObj = JSON.parse(refreshJson);

            if (refreshResponse.status === 200) {
              setTokens((prev: any) => ({
                ...prev,
                access_token: refreshObj.access_token,
                refresh_token: refreshObj.refresh_token,
              }));
            }
          }
        } catch (error) {
          console.log("Failed to fetch contact data", error);
        }
      };

      fetchUserData();

      // return () => {
      //   isActive = false;
      // };
    }, [contact?.uid, user?.gym_id, tokens?.access_token, tokens?.refresh_token, webServer, setTokens, reset])
  );

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
  const updateContact = async (data: any) => {
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
    formData.append('profileUpdate', 'true');

    console.log("FormData ready for fetch:", JSON.stringify(formData));

    const response = await fetch(
      `${webServer}/api/update-contact.php`,
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
        autoHide: true, // prevents the message from disappearing automatically
        onPress: () => hideMessage(), // closes the message when pressed
      });
    } else {
      console.log("Access token expired, requesting new one - updateContact()");

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
              const contactPicturePath = contact?.user_picture_url || contact?.user_profile_url;
              const contactPictureUri = contactPicturePath
                ? `${webServer}/api/${contactPicturePath}`
                : "";

              const selectedProfilePicUri =
                (value as any)?.path ||
                (value as any)?.uri ||
                contactPictureUri ||
                profilePicAPIImage ||
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
                  <Text style={styles.helperText}>Choose a photo from your gallery.</Text>
                  {/* <View style={styles.avatarGrid}>
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
        <View
          // style={[styles.field, { opacity: 0.5 }]}
          // pointerEvents="none"
          style={styles.field}
        >
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
        {/* <View style={styles.field}>
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
        </View> */}
        {/* <View style={styles.field}>
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
        </View> */}
        {/* <View
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
        </View> */}
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
        {/* <View style={styles.field}>
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
        </View> */}
        <View
          // style={[styles.field, { opacity: 0.5 }]}
          // pointerEvents="non e"
          style={styles.field}
        >
          <Text style={styles.formLabel}>Sex</Text>
          <Controller
            name="sex"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => {
              const selectedSex = sexData.find(
                (item) => item.value === (value),
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
        {/* <View
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
        </View> */}

        <View style={globalStyles.loginBtnContainer}>
          <TouchableOpacity
            style={globalStyles.registerBtn}
            onPress={handleSubmit(updateContact)}
          >
            <Text style={globalStyles.registerBtnText}>Save Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={globalStyles.loginBtn}
            onPress={handleDeletePress}
          >
            <Text style={globalStyles.loginBtnText}>Delete Contact</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={globalStyles.loginBtn}
            onPress={handleCancelGymMembershipPress}
          >
            <Text style={globalStyles.loginBtnText}>Cancel Gym Membership</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </>
  );
};

export default UpdateContactForm;
