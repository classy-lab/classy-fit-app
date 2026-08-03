// @ts-nocheck
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
import {
  showMessage,
  hideMessage,
} from "react-native-flash-message";

type FormValues = {
  profilePic?: any;
  email: string;
  fname: string;
  lname: string;
  company: string;
  job: string;
  sex: string;
  phoneNumber: string;
  whatsappNumber: string;
  preferredContact: string;
  gymId: string;
};

const UpdateMemberForm = ({ navigation, member }: { navigation: any; member: any }) => {
  const { tokens, setTokens, webServer } = useContext(UserContext);
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
      email: member?.email ?? "",
      fname: member?.fname ?? "",
      lname: member?.lname ?? "",
      company: member?.company ?? "",
      job: member?.job ?? "",
      sex: "",
      phoneNumber: member?.phone ?? "",
      whatsappNumber: member?.whatsapp ?? "",
      preferredContact: "",
      gymId: member?.gym_id ?? "",
    },
  });

  useFocusEffect(
    useCallback(() => {
      const fetchMemberData = async () => {
        const memberId = member?.uid || member?.id || member?.user_id || member?.sub;
        if (!memberId) return;

        try {
          const response = await fetch(`${webServer}/api/v1/gyms/${member?.gym_id || member?.gymId}/members/${memberId}`, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });

          const json = await response.text();
          const obj = json ? JSON.parse(json) : {};
          const payload = obj?.member || obj?.data || obj?.user || obj;

          if (response.status === 200) {
            const memberSex = [payload?.sex, member?.sex, obj?.data?.sex, obj?.contact?.sex].find(Boolean) ?? "";
            const memberPreferredContact = [payload?.preferred_contact, payload?.preferredContact, member?.preferred_contact].find(Boolean) ?? "";
            const mappedSex = sexData.find((item) => [item.key, item.value].some((option) => String(option ?? "").trim().toLowerCase() === String(memberSex).trim().toLowerCase()))?.value ?? String(memberSex);
            const mappedPreferredContact = preferredContactOptions.find((item) => [item.key, item.value].some((option) => String(option ?? "").trim().toLowerCase() === String(memberPreferredContact).trim().toLowerCase()))?.value ?? String(memberPreferredContact);

            reset({
              email: payload?.email ?? member?.email ?? "",
              fname: payload?.fname ?? member?.fname ?? "",
              lname: payload?.lname ?? member?.lname ?? "",
              company: payload?.company ?? member?.company ?? "",
              job: payload?.job ?? member?.job ?? "",
              sex: mappedSex,
              phoneNumber: payload?.phone ?? member?.phone ?? "",
              whatsappNumber: payload?.whatsapp ?? member?.whatsapp ?? "",
              gymId: payload?.gym_id ?? member?.gym_id ?? member?.gymId ?? "",
              preferredContact: mappedPreferredContact,
              profilePic: undefined,
            });

            const picturePath = payload?.profilePic || payload?.user_picture_url || member?.user_picture_url || member?.profilePic;
            setProfilePicAPIImage(picturePath ? `${webServer}/api/${picturePath}` : "");
          }
        } catch (error) {
          console.log("Failed to fetch member data", error);
        }
      };

      fetchMemberData();
    }, [member?.uid, member?.id, member?.user_id, member?.sub, member?.gym_id, member?.gymId, tokens?.access_token, tokens?.refresh_token, webServer, setTokens, reset])
  );

  const updateMember = async (data: FormValues) => {
    const totalTimeElapsed = Date.now() - formLoadTime.current;
    const memberId = member?.uid || member?.id || member?.user_id || member?.sub;

    if (!memberId) {
      showMessage({
        message: "Action Failed",
        description: "Missing member id. Please reopen this member from the list.",
        type: "danger",
      });
      return;
    }

    if (totalTimeElapsed < MIN_SUBMISSION_TIME_MS) {
      return;
    }

    if (website.trim() !== "") {
      return;
    }

    const formData = new FormData();
    const emailValue = (data?.email ?? member?.email ?? "").trim();
    const fnameValue = (data?.fname ?? member?.fname ?? "").trim();
    const sexValue = getOptionValue(sexData, data?.sex);
    const preferredContactValue = getOptionValue(preferredContactOptions, data?.preferredContact);

    formData.append("uid", memberId);
    formData.append("gym_id", data.gymId || member?.gym_id || member?.gymId || "");
    formData.append("email", emailValue);
    formData.append("fname", fnameValue);
    formData.append("lname", data.lname || member?.lname || "");
    formData.append("company", data.company || member?.company || "");
    formData.append("job", data.job || member?.job || "");
    formData.append("sex", sexValue);
    formData.append("phone", data.phoneNumber || member?.phone || "");
    formData.append("whatsapp", data.whatsappNumber || member?.whatsapp || "");
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
      const response = await fetch(`${webServer}/api/v1/gyms/${member?.gym_id || member?.gymId}/members/${memberId}`, {
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
            const memberPicturePath = member?.profilePic || member?.user_picture_url;
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
              value={value ?? ""}
              keyboardType="default"
              autoCapitalize="words"
            />
          )}
        />
        {errors.company && <Text style={styles.errorText}>{errors.company.message}</Text>}
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
              value={value ?? ""}
              keyboardType="default"
              autoCapitalize="words"
            />
          )}
        />
        {errors.job && <Text style={styles.errorText}>{errors.job.message}</Text>}
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
