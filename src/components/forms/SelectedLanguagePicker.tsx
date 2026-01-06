import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AppColors } from '../../styles/colors';
import { s, vs } from 'react-native-size-matters'

const windowWidth = Dimensions.get('window').width

const SelectedLanguagePicker = () => {
  const [selectedLanguage, setSelectedLanguage] = useState();

  return (
    <View style={styles.container}>
      <Picker
        style={{
          borderWidth: 1,
          borderColor: AppColors.textInputBorderColor,
          height: s(48),
          borderRadius: s(8),
          width: windowWidth - 64,
          backgroundColor: AppColors.grey,
        }}
        selectedValue={selectedLanguage}
        onValueChange={(itemValue, itemIndex) => {
          setSelectedLanguage(itemValue)
          // console.log(selectedLanguage)
        }
        }>
        {/* <Picker.Item label="" value="" /> */}
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />
        <Picker.Item label="Python" value="python" />
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
  },
});

export default SelectedLanguagePicker
