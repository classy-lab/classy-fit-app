import {StyleSheet} from 'react-native'
import { AppColors } from './colors';

export const globalStyles = StyleSheet.create({
   loginBtnContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  registerBtn: {
      backgroundColor: AppColors.blue,
      borderRadius: 40,
      width: 250,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
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
      marginBottom: 16,
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
