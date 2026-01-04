import React from 'react';
import * as yup from 'yup';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { View, Button, Text, TextInput } from 'react-native';

const schema = yup.object().shape({
  email: yup.string().required('Email is required').email('Invalid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must contain at least 8 characters'),
});

const LoginForm = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onPressSend = (formData) => {
    // Perform actions with the validated form data
    console.log(formData)
  };

  return (
    <View>
      <View>
        <Text>E-mail</Text>
        <Controller control={control} rules={{ required: true }} render={({ field: { onChange, value } }) => (<TextInput value={value} onChangeText={onChange} placeholder="Email" />)} name="email" />
        {errors.email && <Text>{errors.email.message}</Text>}
        <Controller control={control} rules={{ required: true }} render={({ field: { onChange, value } }) => (<TextInput value={value} onChangeText={onChange} placeholder="Password" secureTextEntry />)} name="password" />
        {errors.password && <Text>{errors.password.message}</Text>}
        {/* Render other form inputs and their corresponding error messages */}
      </View>
      <Button title="Submit" onPress={handleSubmit(onPressSend)} />
    </View>
  );
};

export default LoginForm;