import React, { useState } from "react";
import {
  View,
  Button,
  Image,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import axios from "axios";

const UploadPhoto = ({ photo, setPhoto /*uploadPhoto*/ }) => {
  // const [photo, setPhoto] = useState(null);

  const selectPhoto = () => {
    launchImageLibrary({ mediaType: "photo" }, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorMessage) {
        console.log("ImagePicker Error: ", response.errorMessage);
      } else {
        // For React Native 0.70+, response.assets[0] contains the image info
        const asset = response.assets[0];
        setPhoto(asset);
      }
    });
  };

  return (
    <>
      <TouchableOpacity onPress={selectPhoto}>
        <View>
          {photo ? (
            <>
              <Image source={{ uri: photo.uri }} style={styles.square} />
              {/* <Button title="Upload Photo" onPress={uploadPhoto} /> */}
            </>
          ) : (
            <Image
              style={styles.image}
              source={require("../../assets/images/profile-img.jpg")}
              resizeMode="contain"
            />
          )}
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
  square: {
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 22,
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
  },
  image: { alignSelf: "center", marginTop: 16 },
});
