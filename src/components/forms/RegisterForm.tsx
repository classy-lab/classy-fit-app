import React, { useState, useEffect } from 'react'
import {Image} from 'react-native'
import * as yup from 'yup';
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import { s } from 'react-native-size-matters'
import SelectedRolePicker from './SelectedRolePicker'
import CheckboxComponent from './CheckboxComponent'
import SexPicker from './SexPicker';
import PreferredContact from './PreferredContact';
import GymLocationPicker from './GymLocationPicker';
import { SelectList } from 'react-native-dropdown-select-list';
import ProfileImage from '../svg/ProfileImage';
import UploadPhoto from '../../screens/app/UploadPhoto';
import Checkbox from 'expo-checkbox';
import axios from 'axios';

const phoneRegExp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/

// 1. Define the Yup validation schema
const schema = yup.object().shape({
  email: yup.string()
  .required('Email is required')
  .email('Invalid email'),
  password: yup.string().required('Password is required')
  .min(13, 'Password must contain at least 13 characters')
  .matches(
    /^[a-zA-Z0-9]+$/,
    'Password must only contain alphanumeric characters (letters and numbers)'
  ),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match') 
    .required('Please confirm your password'),
  role: yup.string().oneOf(['Owner', 'Member', 'Trainer']),
  fname: yup.string().required().min(3),
  lname: yup.string().required().min(2),
  dateOfBirth: yup.string().required('Date of Birth is required'),
  sex: yup.string()
    .oneOf(['Male', 'Female', 'Other'], 'Please select a valid category')
    .required('Category selection is required'),
  phoneNumber: yup.string()
  .matches(phoneRegExp, 'Phone Number is not valid'),
  whatsappNumber: yup.string()
  .matches(phoneRegExp, 'WhatsApp Number number is not valid'),
  preferredContact: yup.string()
  .oneOf(['Phone', 'Email', 'WhatsApp']),
  gymId: yup.string()
  .required('Category selection is required'),
  //  agreeToTerms: yup.boolean()
  //   .oneOf([true], 'You must accept the terms and conditions')
  //   .required('Required'),
});

const RegisterForm = () => {
  const navigation = useNavigation();
  const [photo, setPhoto] = useState(null);
  
  const uploadPhoto = async (last_id) => {
    // console.log('last_id: ' + last_id);
      if (!photo) {
        Alert.alert('No photo selected!');
        return;
      }
  
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        type: photo.type,
        name: photo.fileName || 'photo.jpg',
        last_id: last_id
      });
  
      try {
        const response = await axios.post(
          'http://localhost:8080/udemy/classy-api/api/upload-photo.php?last_id=' + last_id,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        Alert.alert('Upload Success', response.data.message || 'Photo uploaded!');
      } catch (error) {
        console.error(error);
        Alert.alert('Upload Failed', 'Something went wrong.');
      }
    };

  // 1. Parent controls the selected value
  const [sex, setSelected] = useState(""); // sex state lives here
  const sexData = [
    { key: '1', value: 'Male', disabled: false },
    { key: '2', value: 'Female' },
    { key: '3', value: 'Other' },
  ];

  // 1. Parent controls the selected value
  const [PreferredContact, setPreferredContact] = React.useState("");
  const preferredContactData = [
    { key: '1', value: 'Phone', disabled: false },
    { key: '2', value: 'WhatsApp' },
    { key: '3', value: 'Email' },
  ]
  
  // 1. Parent controls the selected value
  const [selectedGym, setSelectedGym] = React.useState("")
  const [gyms, setGyms] = useState([])

  useEffect(() => {
    const fetchGyms = async() => {
      try{
        const response = await fetch('http://localhost:8080/udemy/classy-api/api/GymList.php');
        const json = await response.json();
        setGyms(json);
      } catch(error){
        console.error(error);
      }
    }

    fetchGyms()
  }, []); // <--- Empty array ensures it runs once on mount 

  // console.log(gyms);
  // console.log(selectedGym);

  // 1. Parent controls the selected value
  const [role, setRole] = React.useState("");
  const roleData = [
    { key: '1', value: 'Gym Owner', disabled: true },
    { key: '2', value: 'Member' },
    { key: '3', value: 'Trainer' },
    { key: '4', value: 'Contractor' }
  ]
  
  // 2. Initialize useForm with the Yup resolver
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  // 3. Define the submit handler
  const registerUser = async (data) => {
    // console.log(data);
    // console.log(selected);

    try {
      const response = await axios.post('http://localhost:8080/udemy/classy-api/api/register.php', {
        gym_id: data.gymId,
        username: '',
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        role: data.role,
        fname: data.fname,
        lname: data.lname,
        date_of_birth: data.dateOfBirth,
        sex: data.sex,
        phone: data.phoneNumber,
        whatsapp: data.whatsappNumber,
        preferred_contact: data.preferredContact,
        // user_picture_url: photo,
        // agreeToTerms: data.agreeToTerms,
      });

      console.log(response.data);

      if(response.data.status == 'success'){
        uploadPhoto(response.data.last_id);
      }
    } catch (error) {
      //console.error('There was an error');
      console.error(error.response?.data || error.message);
    }
  };

  return (
    <>
      <View style={styles.fieldset}>
        
        <View style={styles.field}>
          <UploadPhoto photo={photo} setPhoto={setPhoto} uploadPhoto={uploadPhoto} />
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
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
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
                keyboardType='default'
                secureTextEntry
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Confirm Password</Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType='default'
                secureTextEntry
              />
            )}
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Role</Text>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, onBlur, value } }) => (
              <SelectList 
                setSelected={(val) => onChange(val)} // Send selection to hook-form
                data={roleData} 
                save="value"
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
                  backgroundColor: 'white',
                }}
                // If you need to force the value from the parent (e.g., reset)
                // defaultOption={data.find(item => item.value === value)} 
              />
            )}
          />
          {errors.role && <Text style={styles.errorText}>{errors.role.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>First Name</Text>
          <Controller
            control={control}
            name="fname"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
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
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
              />
            )}
          />
          {errors.lname && <Text style={styles.errorText}>{errors.lname.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Date of Birth</Text>
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputField}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="default"
                autoCapitalize="none"
                placeholder="yyyy/mm/dd"
              /> // needs date picker added. check
            )}
          />
          {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Sex</Text>
          <Controller
            name="sex"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <SelectList 
                setSelected={(val) => onChange(val)} // Send selection to hook-form
                data={sexData} 
                save="value"
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
                  backgroundColor: 'white',
                }}
                // If you need to force the value from the parent (e.g., reset)
                // defaultOption={data.find(item => item.value === value)} 
              />
            )}
          />
          {errors.sex && <Text style={styles.errorText}>{errors.sex.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Phone Number</Text>
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
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
          {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>}
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
          {errors.whatsappNumber && <Text style={styles.errorText}>{errors.whatsappNumber.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Preferred Contact</Text>
          <Controller
            control={control}
            name="preferredContact"
            render={({ field: { onChange, onBlur, value } }) => (
              <SelectList 
                setSelected={(val) => onChange(val)} // Send selection to hook-form
                data={preferredContactData} 
                save="value"
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
                  backgroundColor: 'white',
                }}
                // If you need to force the value from the parent (e.g., reset)
                // defaultOption={data.find(item => item.value === value)} 
              />
            )}
          />
          {errors.preferredContact && <Text style={styles.errorText}>{errors.preferredContact.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.formLabel}>Gym Location / Fitness Center</Text>
          <Controller
            control={control}
            name="gymId"
            render={({ field: { onChange, onBlur, value } }) => (
              <SelectList 
                setSelected={(val) => onChange(val)} // Send selection to hook-form
                data={gyms} 
                save="key"
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
                  backgroundColor: 'white',
                }}
                // If you need to force the value from the parent (e.g., reset)
                // defaultOption={data.find(item => item.value === value)} 
              />
            )}
          />
          {errors.gymId && <Text style={styles.errorText}>{errors.gymId.message}</Text>}
        </View>

        <View style={styles.loginBtnContainer}>
          <TouchableOpacity
            style={styles.loginBtn}
            title="loginSubmit"
            onPress={handleSubmit(registerUser)}
          >
            <Text style={styles.loginBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default RegisterForm

const styles = StyleSheet.create({
  fieldset: {
    marginBottom: 32
  },
  email: {},
  formLabel: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 4
  },
  inputField: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.grey
  },
  errorText: {
    color: AppColors.red
  },
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
  },
  selectList: {
    marginBottom: 80,
  }
})
