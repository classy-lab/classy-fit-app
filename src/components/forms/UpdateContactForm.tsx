import { useState, useRef, useContext, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert } from "react-native";
import { useForm, Controller, FieldErrors } from "react-hook-form";
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
import PreferredContact from "./PreferredContact";
import { globalStyles } from "../../styles/globalStyles";
import {
  localAvatarOptions,
  MAX_PROFILE_PIC_BYTES,
  MIN_SUBMISSION_TIME_MS,
  updateContactSchema,
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
  // const { user, setUser } = useContext(UserContext);
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
        filename: profilePic.filename || "profilePic.jpg",
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
    resolver: yupResolver(updateContactSchema),
    shouldFocusError: true, // Automatically moves focus and triggers internal scrolling layout
    defaultValues: {
      profilePic: undefined,
      email: contact?.email ?? "",
      fname: contact?.fname ?? "",
      lname: contact.lname || '',
      company: contact.company || '',
      job: contact.job || '',
      sex: '',
      phoneNumber: '',
      whatsappNumber: '',
      preferredContact: '',
      gymId: '',
    },
  });

  // Watch profilePic to display it
  const profilePicValue = watch("profilePic");

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const response = await fetch(`${webServer}/api/v1/gyms/${contact.gym_id}/contacts/${contact.uid}`, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });

          const json = await response.text();
          const obj = JSON.parse(json);

          if (response.status === 200) {
            const contactSex = obj?.contact?.sex ?? "";
            const mappedContactSex = sexData.find(
              (item) => item.key === String(contactSex) || item.value === contactSex,
            )?.value ?? contactSex;
            console.log(response.status, "Fetched data:", obj);

            reset({
              email: obj?.data?.email,
              fname: obj?.data?.fname,
              lname: obj?.data?.lname,
              company: obj?.data?.company,
              job: obj?.data?.job,
              sex: mappedContactSex,
              phoneNumber: obj?.data?.phone,
              whatsappNumber: obj?.data?.whatsapp,
              gymId: obj?.data?.gym_id,
              preferredContact: obj?.data?.preferred_contact ?? "",
              profilePic: undefined,
            });

            const picturePath = obj?.data?.user_picture_url;
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
    }, [contact?.uid, tokens?.access_token, tokens?.refresh_token, webServer, setTokens, reset])
  );

  const executeProfileDeletion = async ({ tokens, webServer, contact, setTokens }) => {
    console.log("Profile deletion API initiated.");

    const response = await fetch(
      `${webServer}/api/v1/gyms/${contact.gym_id}/contacts/${contact.uid}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + tokens.access_token,
        },
      },
    );

    const json = await response.text();;
    const obj = JSON.parse(json);


    if (response.status === 200) {
      console.log(obj);
      showMessage({
        message: obj?.message,
        type: "success",
        autoHide: true, // prevents the message from disappearing automatically
        onPress: () => hideMessage(), // closes the message when pressed
      });
    }
    else {
      console.log("Access token expired, requesting new one");

      const response = await fetch(`${webServer}/api/refresh.php`, {
        method: "POST",
        body: JSON.stringify({
          token: tokens.refresh_token,
        }),
      });

      const json = await response.text();
      const obj = JSON.parse(json);

      if (response.status === 200) {
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
          onPress: () => executeProfileDeletion({ tokens, webServer, contact, setTokens }),
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
    const emailValue = (data?.email ?? contact?.email ?? "").trim();
    const fnameValue = (data?.fname ?? contact?.fname ?? "").trim();
    const sexValue = sexData.find(
      (item) => item.key === String(data?.sex) || item.value === data?.sex,
    )?.value ?? (data?.sex || "");

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
    formData.append("email", emailValue);
    formData.append("fname", fnameValue);
    formData.append("lname", data.lname);
    formData.append("company", data.company);
    formData.append("job", data.job);
    formData.append("sex", sexValue);
    formData.append("phone", data.phoneNumber);
    formData.append("whatsapp", data.whatsappNumber);
    formData.append("preferred_contact", data.preferredContact);

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
        `${webServer}/api/v1/gyms/${contact.gym_id}/contacts/${contact.uid}`,
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
    handleSubmit(updateContact, handleSubmitErrors)();
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
                  <Text style={styles.helperText}>Max size: 5 MB. Allowed formats: JPG, JPEG, PNG.</Text>
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
                value={value ?? ""}
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
        <View
          // style={[styles.field, { opacity: 0.5 }]}
          // pointerEvents="none"
          style={styles.field}
        >
          <Text style={styles.formLabel}>Sex</Text>
          <Controller
            name="sex"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => {
              const selectedSex = sexData.find(
                (item) => item.key === String(value) || item.value === value,
              );

              return (
                <SelectList
                  setSelected={(selectedValue) => onChange(selectedValue)} // Send selection to hook-form
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
          {errors.company && (
            <Text style={styles.errorText}>{errors.company.message}</Text>
          )}
        </View>
        <View style={styles.field}>
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
          {errors.job && (
            <Text style={styles.errorText}>{errors.job.message}</Text>
          )}
        </View>
        {/* Include the honeypot trap in your form */}
        <HoneypotField value={website} onChangeText={setWebsite} />


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
        <View
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
                value={value ?? ""}
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
            onPress={handleSaveContactPress}
          >
            <Text style={globalStyles.registerBtnText}>Save Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={globalStyles.loginBtn}
            onPress={handleDeletePress}
          >
            <Text style={globalStyles.loginBtnText}>Delete Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default UpdateContactForm;
