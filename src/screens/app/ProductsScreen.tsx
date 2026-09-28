// @ts-nocheck
import { useState, useContext, useEffect, useCallback } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Image, Keyboard, TouchableWithoutFeedback } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import SignOut from '../../components/utils/SignOut'
import { useFocusEffect } from '@react-navigation/native'
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { UserContext } from '../../context/UserContext'
import { useCart } from '../../context/CartContext'

type Product = {
  title?: string;
  primaryImageURL?: string;
  price?: string;
};

const ProductsScreen = ({ navigation, route }) => {
  const { user } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const { totalItemCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  // 1. Define the Yup validation schema
  const schema = yup.object().shape({
    search: yup.string().matches(
      /^[a-zA-Z0-9]*$/,
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

  const formatPrice = (price?: string) => {
    const amount = Number(price ?? 0)
    if (!Number.isFinite(amount) || amount <= 0) {
      return 'Free'
    }

    return `$${amount.toFixed(2)}`
  }

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

      try {
        const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/products`, {
          headers: {
            Authorization: "Bearer " + tokens.access_token,
          },
        });

        const obj = await response.json();

        if (response.status === 200) {
          setProducts(obj.data);
        }
        else {
          console.log("Access token expired, requesting new one - useFocusEffect()");

          const response = await fetch(`${webServer}/api/v1/refresh`, {
            method: "POST",
            body: JSON.stringify({
              token: tokens.refresh_token,
            }),
          });

          const obj = await response.json();

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
  }, [tokens?.access_token, tokens?.refresh_token]);

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
            <View style={styles.headerActions}>
              {/* move to separate component */}
              <TouchableOpacity onPress={() => navigation.navigate('ProductsTab', { screen: 'AddProductScreen' })} style={styles.signOut}>
                <Text style={styles.signOutText}>Add Product</Text>
                <View style={styles.circle}>
                  <MaterialIcons name="add" color={AppColors.white} size={16} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ProductsTab', { screen: 'ViewCartScreen' })} style={styles.signOut}>
                <Text style={styles.signOutText}>Cart</Text>
                <View style={styles.circle}>
                  <Ionicons name="bag-outline" color={AppColors.white} size={16} />
                  {totalItemCount > 0 && (
                    <View style={styles.cartCountBadge}>
                      <Text style={styles.cartCountBadgeText}>{totalItemCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <SignOut />
            </View>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headingContainer}>
              <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <View style={styles.heroIcon}>
                    <Feather name="shopping-bag" color={AppColors.white} size={20} />
                  </View>
                  <View style={styles.heroTextBlock}>
                    <Text style={styles.title}>Products</Text>
                    <Text style={styles.subtitle}>Browse gym products, view details, and add items to your cart.</Text>
                  </View>
                </View>
              </View>
              <PinkLeafSvg style={styles.pinkLeaf} />
            </View>

            <View style={styles.body}>
              <View style={styles.searchCard}>
                <View style={styles.searchRow}>
                  <Feather name="search" color={AppColors.blue} size={18} />
                  <View style={styles.fieldset}>
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
                          placeholder="Search products"
                          style={styles.inputField}
                          keyboardType="default"
                          returnKeyType="done"
                          blurOnSubmit
                          autoCapitalize="none"
                          placeholderTextColor={AppColors.grey3}
                        />
                      )}
                    />
                  </View>
                </View>
                <Text style={styles.searchHint}>Tap any card to open the product details page.</Text>
                {errors.search && <Text style={styles.errorText}>{errors.search.message}</Text>}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Featured products</Text>
                  <View style={styles.countPill}>
                    <Text style={styles.countText}>{filteredProducts.length} items</Text>
                  </View>
                </View>

                {filteredProducts.length === 0 ? (
                  <View style={styles.emptyStateCard}>
                    <View style={styles.emptyIcon}>
                      <Feather name="package" color={AppColors.white} size={24} />
                    </View>
                    <Text style={styles.emptyTitle}>No results found</Text>
                    <Text style={styles.emptyText}>Try a different search term or clear the search field.</Text>
                  </View>
                ) : (
                  <View style={styles.boxes}>
                    {filteredProducts.map((product, index) => {
                      return (
                        <TouchableOpacity
                          key={index}
                          style={styles.productCard}
                          activeOpacity={0.85}
                          onPress={() => navigation.navigate('ProductsTab', { screen: 'ProductDetailScreen', params: { product: product } })}
                        >
                          <View style={styles.imageWrap}>
                            {product.title ? (
                              <Image style={styles.image} source={{ uri: product.primaryImageURL }} />
                            ) : (
                              <View style={styles.placeholderImage}>
                                <Feather name="image" color={AppColors.blue} size={20} />
                              </View>
                            )}
                          </View>
                          <Text style={styles.productTitle} numberOfLines={2} ellipsizeMode="tail">
                            {product.title ?? 'Untitled product'}
                          </Text>
                          <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                          <View style={styles.detailsPill}>
                            <Text style={styles.detailsPillText}>View details</Text>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
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
    backgroundColor: AppColors.grey,
    flex: 1,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headingContainer: {
    marginHorizontal: 20,
    marginBottom: 14,
  },
  title: {
    color: AppColors.blue,
    fontSize: 30,
    fontFamily: 'Montserrat',
    marginBottom: 6,
  },
  subtitle: {
    color: AppColors.grey3,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Montserrat',
  },
  pinkLeaf: {
    position: 'absolute',
    zIndex: -1,
    right: 0,
    top: -8,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 28,
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
    marginRight: 6,
    color: AppColors.blue,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  errorText: {
    color: AppColors.red,
    marginTop: 8,
    fontSize: 12,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: AppColors.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: AppColors.grey,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroTextBlock: {
    flex: 1,
  },
  searchCard: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.grey,
    marginBottom: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchHint: {
    marginTop: 10,
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  fieldset: {
    flex: 1,
  },
  field: {
    flexGrow: 1
  },
  inputField: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    backgroundColor: AppColors.grey,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 16,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Montserrat',
    color: AppColors.blue,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  countPill: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.grey,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: {
    color: AppColors.blue,
    fontSize: 13,
    fontFamily: 'Montserrat',
  },
  boxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: AppColors.grey,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  imageWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: AppColors.grey,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 120,
  },
  productTitle: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 15,
    lineHeight: 20,
    minHeight: 40,
  },
  noResultsText: {
    marginTop: 12,
    color: AppColors.primary,
    fontSize: 14,
  },
  productPrice: {
    marginTop: 6,
    color: AppColors.blue,
    lineHeight: 18,
    fontFamily: 'Montserrat',
    fontSize: 13,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartCountBadge: {
    position: 'absolute',
    right: -7,
    top: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  cartCountBadgeText: {
    color: AppColors.blue,
    fontSize: 10,
  },
  sectionHeading: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateCard: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: AppColors.grey,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 18,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    color: AppColors.grey3,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F8FC',
  },
  detailsPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#EEF5FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detailsPillText: {
    color: AppColors.blue,
    fontSize: 11,
    fontFamily: 'Montserrat',
  },
})
