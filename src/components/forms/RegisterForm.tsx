import * as yup from 'yup';
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Dimensions } from 'react-native'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useFonts } from 'expo-font'
import { s, vs } from 'react-native-size-matters'
import { useState } from 'react'
import { Picker } from '@react-native-picker/picker';
import SelectedLanguagePicker from './SelectedLanguagePicker'

const windowWidth = Dimensions.get('window').width
const schema = yup.object().shape({
  email: yup.string().required('Email is required').email('Invalid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must contain at least 8 characters'),
})

const RegisterForm = () => {
  const navigation = useNavigation()
  const [selectedLanguage, setSelectedLanguage] = useState();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data) => {
    console.log(data)
  };

  return (
    <>
      <View style={styles.fieldset}>
        <View style={styles.email}>
          <Text style={styles.formLabel}>E-mail</Text>
          <TextInput style={styles.inputField} {...register("email")} keyboardType='email-address' />
          {errors.email && <Text>{errors.email.message}</Text>}
        </View>

        <View style={styles.password}>
          <Text style={styles.formLabel}>Password</Text>
          <TextInput style={styles.inputField} {...register("name")} keyboardType='email-address' secureTextEntry />
          {errors.password && <Text style={styles.errorMessage}>{errors.password.message}</Text>}
        </View>

        {/* Render other form inputs and their corresponding error messages */}

        <SelectedLanguagePicker />
        <View style={styles.loginBtnContainer}>
          <TouchableOpacity
            style={styles.loginBtn}
            title="loginSubmit"
            activeOpacity={0.7}
            onPress={() => {
              handleSubmit(onSubmit)
              navigation.navigate('DashboardScreen')
            }}
          >
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default RegisterForm

const styles = StyleSheet.create({
  fieldset: {
    marginTop: s(24)
  },
  email: {
    width: '100%',
  },
  password: {
    marginTop: s(16)
  },
  formLabel: {
    fontSize: s(12),
    marginBottom: s(8)
  },
  inputField: {
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    height: s(48),
    borderRadius: s(8),
    width: windowWidth - 64
  },
  errorMessage: {},
  createAcctBtn: {},
  createAcctBtnText: {},
  loginBtnContainer: {
    alignItems: 'center',
    marginTop: s(16)
  },
  loginBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 250,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    color: AppColors.white,
    fontSize: s(14),
    fontFamily: 'Montserrat-Medium'
  },
})