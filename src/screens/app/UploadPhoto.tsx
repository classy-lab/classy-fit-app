import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { launchImageLibrary } from "react-native-image-picker";

const UploadPhoto = ({ photo, setPhoto }) => {
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
            <Image source={{ uri: photo.uri }} style={styles.square} />
          ) : (
            <Image
              style={styles.image}
              source={require("../../assets/images/profile-img.jpg")}
              resizeMode="contain"
            />
          )}
        </View>
      </TouchableOpacity>
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
