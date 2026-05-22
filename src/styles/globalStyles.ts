import {StyleSheet} from 'react-native'
import { AppColors } from './colors';

export const globalStyles = StyleSheet.create({
  registerBtn: {
      backgroundColor: AppColors.blue,
      borderRadius: 40,
      width: 250,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    registerBtnText: {
      color: "#fff",
      fontSize: 16,
    },
    loginBtn: {
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: AppColors.blue,
      borderRadius: 40,
      width: 250,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    loginBtnText: {
      color: AppColors.blue,
      fontSize: 16,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      marginBottom: 10,
    },
  fieldset: {},
});
