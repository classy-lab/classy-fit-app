import {StyleSheet} from 'react-native'
import { AppColors } from './colors';

export const styles = StyleSheet.create({
  fieldset: {
    marginBottom: 32,
  },
  formLabel: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  inputField: {
    marginTop: 5,
    borderWidth: 1,
    paddingLeft: 8,
    borderColor: AppColors.textInputBorderColor,
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.grey,
  },
  phoneInputContainer: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    borderRadius: 8,
    backgroundColor: AppColors.grey,
    width: "100%",
    height: 48,
  },
  phoneFlagButton: {
    width: 92,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneDropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    justifyContent: "center",
  },
  phoneDropdownFlag: {
    width: 28,
    height: 21,
    borderRadius: 2,
  },
  phoneDropdownArrow: {
    color: AppColors.primary,
    fontSize: 22,
    lineHeight: 22,
    marginTop: 1,
  },
  phoneInputTextContainer: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: AppColors.grey,
    paddingVertical: 0,
  },
  phoneInputText: {
    fontSize: 14,
    color: AppColors.primary,
    paddingVertical: 0,
  },
  phoneInputCodeText: {
    color: AppColors.primary,
    fontSize: 14,
  },
  inputButton: {
    marginTop: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    borderColor: AppColors.textInputBorderColor,
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.grey,
    justifyContent: "center",
  },
  inputButtonText: {
    color: AppColors.primary,
  },
  inputButtonPlaceholder: {
    color: AppColors.grey3,
  },
  errorText: {
    color: AppColors.red,
  },
  imageContainer: { alignItems: "center", marginBottom: 20 },
  imagePickerButton: {
    // marginTop: 4,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 20,
    borderColor: AppColors.grey2,
  },
  helperText: {
    fontSize: 12,
    color: AppColors.grey2,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  avatarOption: {
    margin: 1,
  },
  avatarOptionImage: {
    width: 48,
    height: 48,
    // borderRadius: 28,
    // borderWidth: 1,
    borderColor: AppColors.grey2,
  },
  loginBtnContainer: {
    alignItems: "center",
    marginTop: 16,
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
    fontSize: 14,
  },
  selectList: {
    marginBottom: 80,
  },
  agreement: {
    fontSize: 12,
    marginTop: 20,
    lineHeight: 24,
  },
  linkText: {
    fontSize: 12,
    color: AppColors.blue,
  },
  field: {},
});
