// @ts-nocheck
import React, { useContext, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { AppColors } from "../../styles/colors";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import VectorImageSvg from "../../components/svg/VectorImageSvg";
import SignOut from "../../components/utils/SignOut";
import { UserContext } from "../../context/UserContext";
import { showMessage } from "react-native-flash-message";
import UpdateContactForm from "../../components/forms/UpdateContactForm";

type FormValues = {
  fname: string;
  lname: string;
  email: string;
  phone: string;
  whatsapp: string;
};

const UpdateContactScreen = ({ navigation }: { navigation: any }) => {
  const route = useRoute<any>();
  const { webServer, tokens, setTokens } = useContext(UserContext);

  const contactId = route?.params?.contactId;
  const contact = route?.params?.contact || {};

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      fname: contact?.fname || "",
      lname: contact?.lname || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      whatsapp: contact?.whatsapp || "",
    },
  });

  useEffect(() => {
    // console.log(`${webServer}/api/v1/contacts/${contact.uid}`);
    // console.log("Contact Data:", contact);
    const fetchContactData = async ({ tokens, webServer, setTokens }) => {
      const response = await fetch(`${webServer}/api/v1/contacts/${contact.uid}`, {
        headers: {
          Authorization: "Bearer " + tokens.access_token,
        },
      });

      const json = await response.text();
      const obj = JSON.parse(json);
      // console.log("Fetched contact data:", obj);
    }



    reset({
      fname: contact?.fname || "",
      lname: contact?.lname || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      whatsapp: contact?.whatsapp || "",
    });
  }, [contact, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!contactId) {
      showMessage({
        message: "Action Failed",
        description: "Missing contact id. Please reopen this contact from the list.",
        type: "danger",
      });
      return;
    }

    try {
      const response = await fetch(`${webServer}/api/update-contact.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : {}),
        },
        body: JSON.stringify({
          contact_id: contactId,
          fname: data.fname,
          lname: data.lname,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp,
        }),
      });

      const raw = await response.text();
      const payload = raw ? JSON.parse(raw) : {};

      if (response.status === 200) {
        showMessage({
          message: "Success",
          description: payload?.message || "Contact updated successfully.",
          type: "success",
        });
        navigation.goBack();
        return;
      }

      showMessage({
        message: "Action Failed",
        description:
          payload?.message ||
          "Could not update this contact. Verify the update endpoint on the API.",
        type: "danger",
      });
    } catch (error) {
      showMessage({
        message: "Action Failed",
        description: "Network error while updating contact.",
        type: "danger",
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
            <View style={styles.imagePickerButton}>

            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.title}>
                {contact?.fname || "Contact"} {contact?.lname || ""}
              </Text>
              <Text style={styles.subHead}>
                Update Contact
              </Text>
            </View>
          </View>
          <View style={styles.body}>
            <UpdateContactForm navigation={navigation} contact={contact} />
          </View>
          <View style={styles.imageContainer}>
            <VectorImageSvg />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default UpdateContactScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
  },
  navs: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 24,
  },
  headingContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 32,
    marginTop: 32,
    textAlign: "center",
  },
  subHead: {
    fontFamily: "Montserrat",
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 8,
    flex: 1,
  },
  formLabel: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 4,
    color: AppColors.primary,
  },
  inputField: {
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    paddingLeft: 12,
    height: 48,
    borderRadius: 8,
    color: AppColors.blue,
  },
  field: {
    marginBottom: 8,
  },
  errorText: {
    color: AppColors.red,
    marginTop: 8,
  },
  buttonRow: {
    alignItems: "center",
    marginTop: 16,
  },
  saveBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 250,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: {
    color: AppColors.white,
    fontSize: 14,
  },
  imageContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  scrollView: {},
});
