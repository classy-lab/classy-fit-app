import { StyleSheet } from "react-native";
import { s } from 'react-native-size-matters'
import { AppColors } from "./colors";

export const gymScreenStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 24,
    marginBottom: 16,
    width: '100%'
  },
  greySquares: {
    // borderWidth: 1, borderRadius: 'red',
    // flexDirection: 'row',
    // flexWrap: 'wrap',
    // justifyContent: 'flex-start',
    columnGap: 8,
    rowGap: 16
  },
  greySquareContainer: {
    alignItems: 'center',
    // borderWidth: 1, borderRadius: 'red',
  },
  greySquare: {
    backgroundColor: AppColors.grey,
    width: s(96),
    height: s(96),
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  whiteSquare: {
    backgroundColor: AppColors.white,
    borderRadius: s(16),
    width: s(60),
    height: s(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: s(8)
  },
  cardText: {
    textAlign: 'center',
    marginTop: 8
  }
});
