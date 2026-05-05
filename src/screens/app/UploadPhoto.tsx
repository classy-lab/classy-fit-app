import React, { useState } from 'react';
import { View, Button, Image, Alert, TouchableOpacity, StyleSheet} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';

const UploadPhoto = () => {
  const [photo, setPhoto] = useState(null);

  const selectPhoto = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        // For React Native 0.70+, response.assets[0] contains the image info
        const asset = response.assets[0];
        setPhoto(asset);
      }
    });
  };

  const uploadPhoto = async () => {
    if (!photo) {
      Alert.alert('No photo selected!');
      return;
    }

    const formData = new FormData();
    formData.append('photo', {
      uri: photo.uri,
      type: photo.type,
      name: photo.fileName || 'photo.jpg',
    });

    try {
      const response = await axios.post(
        'http://localhost:8080/udemy/classy-api/api/upload-photo.php',
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

  return (
    <>
      <TouchableOpacity onPress={selectPhoto}>
          <View style={styles.card}>
            {photo ?
              <>
                <Image
                  source={{ uri: photo.uri }}
                  style={{ width: 200, height: 200, marginVertical: 20 }}
                />
                <Button title="Upload Photo" onPress={uploadPhoto} />
              </>
              :
              <Image style={styles.image} source={require('../../assets/images/profile-img.jpg')} resizeMode="contain" />
            }
          </View>
      </TouchableOpacity>
      {/* <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Button title="Select Photo" onPress={selectPhoto} />
        {photo && (
          <Image
            source={{ uri: photo.uri }}
            style={{ width: 200, height: 200, marginVertical: 20 }}
          />
        )}
        <Button title="Upload Photo" onPress={uploadPhoto} />
      </View> */}
    </>
  );
};

export default UploadPhoto;

const styles = StyleSheet.create({
  card: { alignSelf: 'center', marginTop: 16 },
});
