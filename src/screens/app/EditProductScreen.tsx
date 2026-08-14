import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRoute } from '@react-navigation/native';
import { AppColors } from '../../styles/colors';

const EditProductScreen = ({ navigation }: { navigation: any }) => {
  const route = useRoute<any>();
  const product = route?.params?.product || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Feather
          name="arrow-left"
          color={AppColors.blue}
          size={36}
          onPress={() => navigation.goBack()}
        />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Edit Product</Text>
          <Text style={styles.subHead}>{product?.title || 'Product'}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.placeholderText}>
            EditProductScreen is ready for product editing form wiring.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProductScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 32,
  },
  subHead: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 18,
    marginTop: 8,
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
  },
  placeholderText: {
    color: AppColors.primary,
    lineHeight: 22,
  },
  scrollView: {},
});
