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
        <View style={styles.field}>
          <Text style={styles.formLabel}>E-mail</Text>
          <TextInput style={styles.inputField} name="email" {...register("email")} keyboardType='email-address' />
          {errors.email && <Text>{errors.email.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Password</Text>
          <TextInput style={styles.inputField} name="password"  {...register("password")} keyboardType='default' secureTextEntry />
          {errors.password && <Text style={styles.errorMessage}>{errors.password.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Confirm Password</Text>
          <TextInput style={styles.inputField} name="confirmPassword"  {...register("confirmPassword")} keyboardType='default' secureTextEntry />
          {errors.password && <Text style={styles.errorMessage}>{errors.password.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Role</Text>
          <SelectedLanguagePicker name="role"  {...register("role")} />
          {errors.password && <Text style={styles.errorMessage}>{errors.password.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>First Name</Text>
          <TextInput style={styles.inputField} name="fname" {...register("fname")} keyboardType='default' />
          {errors.fname && <Text>{errors.fname.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Last Name</Text>
          <TextInput style={styles.inputField} name="lname" {...register("lname")} keyboardType='default' />
          {errors.lname && <Text>{errors.lname.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Date of Birth</Text>
          <TextInput style={styles.inputField} name="dateOfBirth" {...register("dateOfBirth")} keyboardType='default' />
          {errors.dateOfBirth && <Text>{errors.dateOfBirth.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Age</Text>
          <TextInput style={styles.inputField} name="age" {...register("age")} keyboardType='default' />
          {errors.age && <Text>{errors.age.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Sex</Text>
          <TextInput style={styles.inputField} name="sex" {...register("sex")} keyboardType='default' />
          {errors.age && <Text>{errors.age.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Phone Number</Text>
          <TextInput style={styles.inputField} name="phoneNumber" {...register("phoneNumber")} keyboardType='default' />
          {errors.age && <Text>{errors.age.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>WhatsApp Number</Text>
          <TextInput style={styles.inputField} name="whatsappNumber" {...register("whatsappNumber")} keyboardType='default' />
          {errors.age && <Text>{errors.age.message}</Text>}
        </View>

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
    marginBottom: s(32)
  },
  email: {
    // width: '100%',
  },
  formLabel: {
    fontSize: s(12),
    marginTop: s(16),
    // marginBottom: s(-10)
  },
  inputField: {
    marginTop: s(5),
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    height: s(48),
    borderRadius: s(8),
    width: windowWidth - 64,
    backgroundColor: AppColors.grey
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