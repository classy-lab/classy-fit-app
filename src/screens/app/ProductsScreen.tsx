// @ts-nocheck
import { useState, useContext, useEffect, useCallback } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Image, Keyboard, TouchableWithoutFeedback } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import SignOut from '../../components/utils/SignOut'
import { useFocusEffect } from '@react-navigation/native'
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { UserContext } from '../../context/UserContext'

type Product = {
  title?: string;
  primaryImageURL?: string;
  price?: string;
};

const ProductsScreen = ({ navigation, route }) => {
  const { user } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const [products, setProducts] = useState<Product[]>([]);

  // 1. Define the Yup validation schema
  const schema = yup.object().shape({
    search: yup.string().required('Search field is required').matches(
      /^[a-zA-Z0-9]+$/,
      'Search must only contain alphanumeric characters (letters and numbers)'
    )
  })

  // 2. Initialize useForm with the Yup resolver
  const { control, watch, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      search: '',
    },
  })

  const searchQuery = (watch('search') || '').trim().toLowerCase();

  const matchesSearch = (product: Product) => {
    if (!searchQuery) return true; // If search query is empty, show all products
    const title = (product.title || '').toLowerCase();
    return title.includes(searchQuery);
  }

  const filteredProducts = products.filter(matchesSearch);

  // 3. Define the submit handler
  const onSubmit = async (data) => {
    // This function only runs if validation passes
    console.log('Form Submitted (Validation Passed):', data);

    try {
      // Perform your authentication logic or API call here
      // const response = await api.post('/login', data);
      // If successful, navigate to the Login page or another desired screen
      // navigation.navigate('DashboardScreen');
    } catch (error) {
      // Handle API errors (React Hook Form does not swallow errors here)
      console.error("Login failed:", error);
      // Optionally, show an error message to the user
    }
  }

  const [imageCacheKey, setImageCacheKey] = useState(Date.now());

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user?.gym_id || !tokens?.access_token) {
        return;
      }

      try {
        const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/products`, {
          headers: {
            Authorization: "Bearer " + tokens.access_token,
          },
        });

        const data = await response.json();

        if (response.status === 200) {
          setProducts(data.data);
        }
        else {
          console.log("Access token expired, requesting new one - useFocusEffect()");

          const response = await fetch(`${webServer}/api/refresh.php`, {
            method: "POST",
            body: JSON.stringify({
              token: tokens.refresh_token,
            }),
          });

          const json = await response.text();
          const obj = JSON.parse(json);

          if (response.status === 200) {
            console.log("Got new access token and refresh token");
            setTokens((prev: any) => ({
              ...prev,
              access_token: obj.access_token,
              refresh_token: obj.refresh_token,
            }));
          }
        }
      } catch (error) {
        console.log('Failed to fetch products:', error);
      }
    }
    fetchProducts();
  }, [user?.gym_id, tokens?.access_token]);

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          <View style={styles.navs}>
            <Feather
              name="arrow-left"
              color={AppColors.blue}
              size={36}
              onPress={() => {
                navigation.goBack();
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
              {/* move to separate component */}
              <TouchableOpacity onPress={() => navigation.navigate('ProductsTab', { screen: 'AddProductScreen' })} style={styles.signOut}>
                <Text style={styles.signOutText}>Add</Text>
                <View style={styles.circle}>
                  <MaterialIcons name="add" color={AppColors.white} size={16} />
                </View>
              </TouchableOpacity>
              <SignOut />
            </View>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headingContainer}>
              <Text style={styles.title}>Products</Text>
              <PinkLeafSvg style={styles.pinkLeaf} />
            </View>
            <View style={styles.body}>

              <View style={styles.fieldset}>
                <View style={styles.field}>
                  <Controller
                    control={control}
                    name="search"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        onBlur={() => {
                          onBlur();
                          handleSubmit(onSubmit)();
                        }}
                        onSubmitEditing={() => {
                          Keyboard.dismiss();
                        }}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Search"
                        style={styles.inputField}
                        keyboardType="default"
                        returnKeyType="done"
                        blurOnSubmit
                        autoCapitalize="none"
                        placeholderTextColor={AppColors.blue}
                      />
                    )}
                  />
                </View>
                {/* Render other form inputs and their corresponding error messages */}
                {errors.search && <Text style={styles.errorText}>{errors.search.message}</Text>}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Products</Text>
                  <Text style={styles.countText}>Count: {filteredProducts.length}</Text>
                </View>
                <View style={styles.boxes}>
                  {filteredProducts.length === 0 ? (
                    <Text style={styles.noResultsText}>No results found</Text>
                  ) :
                    (
                      filteredProducts.map((product, index) => {
                        return (
                          <TouchableOpacity key={index} onPress={() => navigation.navigate('ProductsTab', { screen: 'ProductDetailScreen', params: { product: product } })}>
                            <View style={styles.box}>
                              {
                                product.title ? (
                                  <Image style={styles.image} source={{ uri: product.primaryImageURL }} />
                                ) : null
                              }
                              <Text style={styles.productTitle} numberOfLines={1} ellipsizeMode="tail">{product.title ?? ''}</Text>
                              <Text style={styles.productPrice}>{product.price ?? ''}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                </View>

              </View>

            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </>
  )
}

export default ProductsScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.blue,
    fontSize: 32,
    marginTop: 20,
    marginBottom: 40,
    width: 320,
    textAlign: "center",
  },
  pinkLeaf: {
    position: "absolute",
    zIndex: -1,
    right: 96,
  },
  body: {
    flex: 1,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.primary,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    marginLeft: 10,
    marginRight: 4,
    color: AppColors.blue,
    fontSize: 14
  },
  errorText: {
    color: AppColors.red,
  },
  fieldset: {},
  field: {
    flexGrow: 1
  },
  inputField: {
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    paddingLeft: 22,
    height: 48,
    borderRadius: 8,
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 16,
  },
  section: {
    marginTop: 24,
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 24,
  },
  boxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 24,
    justifyContent: 'space-evenly',
  },
  box: {
    width: 96,
    alignItems: 'center',
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 16
  },
  productTitle: {
    marginTop: 10,
    textAlign: 'center',
  },
  noResultsText: {
    marginTop: 12,
    color: AppColors.primary,
    fontSize: 14,
  },
  productPrice: {
    marginTop: 4,
    color: AppColors.grey2,
    lineHeight: 18,
    minHeight: 18,
  },
  noResultsText: {
    marginTop: 12,
    color: AppColors.primary,
    fontSize: 14,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  countText: {
    color: AppColors.blue
  },
})
