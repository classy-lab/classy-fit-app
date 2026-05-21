import React, { useState, useContext, useEffect, useRef } from "react";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Button,
} from "react-native";
import { AppColors } from "../../styles/colors";
import { useNavigation } from "@react-navigation/native";
import { s } from "react-native-size-matters";
import { UserContext } from "../../context/UserContext";
import HoneypotField from "./input_fields/HoneypotField";

const windowWidth = Dimensions.get("window").width;

const MIN_SUBMISSION_TIME_MS = 5000; // 5 seconds threshold before reg form can be submitted

const LoginForm = () => {
  const navigation = useNavigation();
  const { user, setUser } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { isLoggedIn, setIsLoggedIn } = useContext(UserContext);
  const [website, setWebsite] = useState("");

  // Use a ref to store the load time without triggering re-renders
  const formLoadTime = useRef(Date.now());

  // Reset the timer if the user navigates back to this screen
  useEffect(() => {
    formLoadTime.current = Date.now();
  }, []);

  // 1. Define the Yup validation schema
  const schema = yup.object().shape({
    email: yup.string().required("Email is required").email("Invalid email"),
    password: yup
      .string()
      .required("Password is required")
      .min(2, "Password must contain at least 2 characters")
      .matches(
        /^[a-zA-Z0-9]+$/,
        "Password must only contain alphanumeric characters (letters and numbers)",
      ),
  });

  // 2. Initialize useForm with the Yup resolver
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "help@simplecssjs.com",
      password: "ppppppppppppp",
    },
  });

  // 3. Define the submit handler
  const onSubmit = async (data) => {
    const totalTimeElapsed = Date.now() - formLoadTime.current;

    // 1. Honeypot check
    if (website.trim() !== "") {
      // console.log("Submission failed", "Bot behavior detected.");
      return;
    }

    // 2. Timestamp check
    if (totalTimeElapsed < MIN_SUBMISSION_TIME_MS) {
      // console.log("Submission failed", "Form submitted too quickly.");
      return;
    }

    // This function only runs if validation passes
    console.log("Form Submitted (Validation Passed):", data);

    try {
      // Perform your authentication logic or API call here
      // const response = await api.post('/login', data);
      // If successful, navigate to the Login page or another desired screen

      const response = await fetch(
        "http://localhost:8080/classy-api/api/login.php",
        {
          method: "POST",
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        },
      );

      const json = await response.text();
      const obj = JSON.parse(json);

      if (response.status == 200) {
        setTokens(obj); // store access_token, refresh_token in app memory
        const payload = obj.access_token.split(".");
        const userPayload = JSON.parse(atob(payload[1]));
        setUser(userPayload); // store token payload user info
        setIsLoggedIn("true"); // set loggedIn status to true
        console.log(userPayload);
        // navigation.navigate('DashboardScreen'); // needed ? should automatically redirect without this line
      } else {
        console.log(obj.message);
      }
    } catch (error) {
      // Handle API errors (React Hook Form does not swallow errors here)
      console.error("Login failed:", error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <>
      <View style={styles.fieldset}>
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
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
              />
            )}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}
        </View>

        <HoneypotField value={website} onChangeText={setWebsite} />

        {/* Render other form inputs and their corresponding error messages */}
        <View style={styles.loginBtnContainer}>
          <TouchableOpacity
            style={styles.loginBtn}
            title="loginSubmit"
            activeOpacity={0.7}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default LoginForm;

const styles = StyleSheet.create({
  fieldset: {
    marginTop: s(24),
  },
  email: {
    width: "100%",
  },
  field: {
    marginTop: s(16),
  },
  formLabel: {
    fontSize: s(12),
    marginBottom: s(8),
  },
  inputField: {
    borderWidth: 1,
    paddingLeft: 8,
    borderColor: AppColors.textInputBorderColor,
    height: s(48),
    borderRadius: s(8),
    width: windowWidth - 64,
  },
  errorText: {
    color: AppColors.red,
  },
  createAcctBtn: {},
  createAcctBtnText: {},
  loginBtnContainer: {
    alignItems: "center",
    marginTop: s(16),
  },
  loginBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 250,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    color: AppColors.white,
    fontSize: s(14),
  },
});
