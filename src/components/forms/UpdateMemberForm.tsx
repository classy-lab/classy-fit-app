// @ts-nocheck
import { useState, useRef, useContext, useCallback, useEffect } from "react";
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
import {
  showMessage,
  hideMessage,
} from "react-native-flash-message";

type FormValues = {
  profilePic?: any;
  email: string;
  fname: string;
  lname: string;
  sex: string;
  phoneNumber: string;
  whatsappNumber: string;
  preferredContact: string;
  gymId: string;
};

const UpdateMemberForm = ({ navigation, memberData }: { navigation: any; memberData: any }) => {
  const { tokens, webServer } = useContext(UserContext);
  const [website, setWebsite] = useState("");
  const [profilePicAPIImage, setProfilePicAPIImage] = useState<string>("");
  const preferredContactOptions = [
    { key: "1", value: "Phone" },
    { key: "2", value: "WhatsApp" },
    { key: "3", value: "Email" },
  ];
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
        filename: profilePic.filename || "member-profile.jpg",
        fileSize,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const formLoadTime = useRef(Date.now());

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(updateContactSchema),
    shouldFocusError: true,
    defaultValues: {
      profilePic: undefined,
      email: memberData.email,
      fname: memberData.fname,
      lname: memberData.lname,
      sex: "",
      phoneNumber: memberData.phone,
      whatsappNumber: memberData.whatsapp,
      preferredContact: "",
      gymId: memberData.gym_id,
    },
  });

  useEffect(() => {
    const memberSex = memberData.sex;
    const memberPreferredContact = memberData.preferred_contact;
    const mappedSex = sexData.find((item) => [item.key, item.value].some((option) => String(option ?? "").trim().toLowerCase() === String(memberSex).trim().toLowerCase()))?.value ?? String(memberSex);
    const mappedPreferredContact = preferredContactOptions.find((item) => [item.key, item.value].some((option) => String(option ?? "").trim().toLowerCase() === String(memberPreferredContact).trim().toLowerCase()))?.value ?? String(memberPreferredContact);

    reset({
      profilePic: undefined,
      email: memberData.email,
      fname: memberData.fname,
      lname: memberData.lname,
      sex: mappedSex,
      phoneNumber: memberData.phone,
      whatsappNumber: memberData.whatsapp,
      preferredContact: mappedPreferredContact,
      gymId: memberData.gym_id,
    });
  }, [memberData, reset]);

  useFocusEffect(
    useCallback(() => {
      const fetchMemberData = async () => {
        const memberId = memberData.uid;
        console.log("Fetching member data for memberId:", memberId);
        console.log("Gym ID:", memberData.gym_id);

        try {
          const response = await fetch(`${webServer}/api/v1/gyms/${memberData.gym_id}/members/${memberId}`, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });

          const json = await response.text();
          const obj = json ? JSON.parse(json) : {};
          const payload = obj?.member || obj?.data || obj?.user || obj;

          if (response.status === 200) {
            const memberSex = payload?.sex || memberData.sex;
            const memberPreferredContact = payload?.preferred_contact || memberData.preferred_contact;
            const mappedSex = sexData.find((item) => [item.key, item.value].some((option) => String(option ?? "").trim().toLowerCase() === String(memberSex).trim().toLowerCase()))?.value ?? String(memberSex);
            const mappedPreferredContact = preferredContactOptions.find((item) => [item.key, item.value].some((option) => String(option ?? "").trim().toLowerCase() === String(memberPreferredContact).trim().toLowerCase()))?.value ?? String(memberPreferredContact);

            reset({
              email: payload?.email || memberData.email,
              fname: payload?.fname || memberData.fname,
              lname: payload?.lname || memberData.lname,
              sex: mappedSex,
              phoneNumber: payload?.phone || memberData.phone,
              whatsappNumber: payload?.whatsapp || memberData.whatsapp,
              gymId: payload?.gym_id || memberData.gym_id,
              preferredContact: mappedPreferredContact,
              profilePic: undefined,
            });

            const picturePath = payload?.profilePic || payload?.user_picture_url || memberData.user_picture_url || memberData.profilePic;
            setProfilePicAPIImage(picturePath ? `${webServer}/api/${picturePath}` : "");
          }
        } catch (error) {
          console.log("Failed to fetch member data", error);
        }
      };

      fetchMemberData();
    }, [memberData.uid, memberData.gym_id, tokens?.access_token, webServer, reset])
  );

  const updateMember = async (data: FormValues) => {
    const totalTimeElapsed = Date.now() - formLoadTime.current;
    // const memberId = memberData.uid;

    if (totalTimeElapsed < MIN_SUBMISSION_TIME_MS) {
      return;
    }

    if (website.trim() !== "") {
      return;
    }

    const formData = new FormData();
    const emailValue = data.email.trim();
    const fnameValue = data.fname.trim();
    const sexValue = getOptionValue(sexData, data.sex);
    const preferredContactValue = getOptionValue(preferredContactOptions, data.preferredContact);

    formData.append("uid", memberData.uid);
    formData.append("gym_id", data.gymId);
    formData.append("email", emailValue);
    formData.append("fname", fnameValue);
    formData.append("lname", data.lname);
    formData.append("sex", sexValue);
    formData.append("phone", data.phoneNumber);
    formData.append("whatsapp", data.whatsappNumber);
    formData.append("preferred_contact", preferredContactValue);

    const profilePicPayload = data.profilePic
      ? {
        uri: data.profilePic?.path || data.profilePic?.uri,
        type: data.profilePic?.mime || data.profilePic?.type || "image/png",
        name: data.profilePic?.filename || data.profilePic?.name || "member-profile.png",
      }
      : profilePicAPIImage || "";

    formData.append("profilePic", profilePicPayload as any);

    try {
      const response = await fetch(`${webServer}/api/v1/gyms/${memberData.gym_id}/members/${memberData.uid}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
        body: formData,
      });

      const rawBody = await response.text();
      let obj: any = null;

      try {
        obj = rawBody ? JSON.parse(rawBody) : null;
      } catch (parseError) {
        console.log("Update member response is not valid JSON:", parseError);
      }

      if (response.status === 200) {
        showMessage({
          message: obj?.message || "Member updated successfully.",
          type: "success",
          autoHide: true,
          onPress: () => hideMessage(),
        });
      } else {
        showMessage({
          message: "Action Failed",
          description: obj?.message || "Could not update this member.",
          type: "danger",
        });
      }
    } catch (error) {
      console.log("Update member request failed", error);
      showMessage({
        message: "Action Failed",
        description: "Network error while updating member.",
        type: "danger",
      });
    }
  };

  const handleSubmitErrors = (formErrors: FieldErrors<any>) => {
    console.log("Save member blocked by validation:", formErrors);
  };

  const handleSaveMemberPress = () => {
    handleSubmit(updateMember, handleSubmitErrors)();
  };

  return (
    <View style={styles.fieldset}>
      <View style={styles.field}>
        <Controller
          control={control}
          name="profilePic"
          render={({ field: { onChange, value } }) => {
            const memberPicturePath = memberData.profilePic || memberData.user_picture_url;
            const memberPictureUri = memberPicturePath ? `${webServer}/api/${memberPicturePath}` : "";
            const selectedProfilePicUri =
              (value as any)?.path ||
              (value as any)?.uri ||
              memberPictureUri ||
              profilePicAPIImage ||
              "";

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

      <View style={styles.field}>
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

      <View style={styles.field}>
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
              value={value ?? ""}
              keyboardType="default"
              autoCapitalize="none"
            />
          )}
        />
        {errors.lname && <Text style={styles.errorText}>{errors.lname.message}</Text>}
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
              value={value ?? ""}
              keyboardType="default"
              autoCapitalize="none"
            />
          )}
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>}
      </View>

      <View style={styles.field}>
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
                key={value || "sex-empty"}
                setSelected={(selectedValue) => onChange(selectedValue)}
                data={sexData}
                save="value"
                defaultOption={selectedSex ? { key: selectedSex.key, value: selectedSex.value } : undefined}
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
              value={value ?? ""}
              keyboardType="default"
              placeholder="518-555-5555"
              autoCapitalize="none"
            />
          )}
        />
        {errors.whatsappNumber && <Text style={styles.errorText}>{errors.whatsappNumber.message}</Text>}
      </View>

      <View style={styles.field}>
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

      <View style={styles.field}>
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

      <View style={globalStyles.loginBtnContainer}>
        <TouchableOpacity style={globalStyles.registerBtn} onPress={handleSaveMemberPress}>
          <Text style={globalStyles.registerBtnText}>Save Member</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UpdateMemberForm;
