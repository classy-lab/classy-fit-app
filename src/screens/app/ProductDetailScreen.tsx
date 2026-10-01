// @ts-nocheck
import { StyleSheet, Text, View, ScrollView, Image, useWindowDimensions, TouchableOpacity } from 'react-native'
import { useState, useCallback, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useFocusEffect } from '@react-navigation/native'
import { AppColors } from '../../styles/colors'
import { s } from 'react-native-size-matters'
import { UserContext } from '../../context/UserContext'
import RenderHtml from 'react-native-render-html';
import { showMessage } from 'react-native-flash-message'
import { useCart } from '../../context/CartContext'

const ProductDetailScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const { user } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const { addToCart, totalItemCount } = useCart();
  const [product, setProduct] = useState({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const productId = route?.params?.product?.pid ?? route?.params?.product?.uid ?? route?.params?.productId;

  const handleSubmit = (quantity = 1) => {
    const lineQuantity = addToCart(product, quantity);
    showMessage({
      message: 'Added to Cart',
      description: `${lineQuantity} item${lineQuantity > 1 ? 's' : ''} in cart`,
      type: 'success',
    });
  }

  useFocusEffect(
    useCallback(() => {
      const fetchProduct = async () => {
        try {                           // http://localhost:8080/classy-api/api/v1/gyms/1/products/5
          if (!productId) {
            return;
          }

          const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/products/${productId}`, {
            headers: {
              Authorization: "Bearer " + tokens.access_token,
            },
          });

          const data = await response.json();

          if (response.status === 200) {
            setProduct(data.data);
            setSelectedImageIndex(0);
          }
          else {
            console.log("Access token expired, requesting new one");

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
          console.log('ProductDetailScreen product error: ', error);
        }
      }
      fetchProduct();
    }, [tokens?.access_token, tokens?.refresh_token, productId, user?.gym_id, webServer, setTokens])
  );

  const selectedImage = product?.images?.[selectedImageIndex]?.image_url || product?.images?.[0]?.image_url || null;
  const sizeLabelMap = { S: 'Small', M: 'Medium', L: 'Large' };
  const normalizedSize = String(product?.size ?? '').trim().toUpperCase();
  const displaySize = sizeLabelMap[normalizedSize] || product?.size;
  const normalizedUserRole = String(user?.role ?? '').trim().toLowerCase();
  const isAdmin = normalizedUserRole === 'owner' || normalizedUserRole === 'admin';
  const stockCount = Number(product?.quantity_in_stock ?? 0);
  const stockStatus = stockCount <= 0 ? 'Out of Stock' : stockCount <= 5 ? 'Low Stock' : 'In Stock';
  const stockStatusColor = stockCount <= 0 ? AppColors.red : stockCount <= 5 ? '#D97706' : '#15803D';
  const numericPrice = Number(product?.price ?? 0);
  const numericSalePrice = Number(product?.sale_price ?? 0);
  const hasDiscount = numericSalePrice > 0 && numericPrice > numericSalePrice;
  const youSaveAmount = hasDiscount ? (numericPrice - numericSalePrice).toFixed(2) : null;

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => navigation.navigate('ProductsScreen')} />
          <View style={styles.headerActions}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.editIconButton}
                onPress={() => { navigation.navigate('EditProductScreen', { product }) }}
                activeOpacity={0.8}
              >
                <Feather name="edit-2" color={AppColors.blue} size={18} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => { handleSubmit(1) }}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" color={AppColors.blue} size={18} />
              <Text style={styles.quickAddButtonText}>Add 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewCartIconButton}
              onPress={() => { navigation.navigate('ViewCartScreen') }}
              activeOpacity={0.8}
            >
              <Ionicons name="bag-outline" color={AppColors.blue} size={24} />
              {totalItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalItemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.body}>
            <View>
              <View style={styles.heroImageContainer}>
                <Image
                  style={styles.heroImage}
                  source={{ uri: selectedImage }}
                  resizeMode="cover"
                />
              </View>
              {product?.images?.length > 0 && (
                <View style={styles.heroImageThumbnails}>
                  {product.images.map((image, index) => (
                    <TouchableOpacity key={`${image?.image_url || index}`} onPress={() => setSelectedImageIndex(index)}>
                      <Image
                        style={[
                          styles.thumbnail,
                          selectedImageIndex === index && styles.selectedThumbnail,
                        ]}
                        source={{ uri: image?.image_url || null }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.content}>
              <Text style={styles.productTitle}>{product?.title}</Text>
              <View style={styles.descriptionBlock}>
                <Text style={styles.formLabel}>Description:</Text>
                {/* <ScrollView style={styles.descriptionScroll} showsVerticalScrollIndicator={false}> */}
                <RenderHtml
                  contentWidth={width - 48}
                  source={{ html: product?.description || '<p>No description available.</p>' }}
                  tagsStyles={tagsStyles}
                  baseStyle={styles.productDesc}
                />
                {/* </ScrollView> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>SKU: {product?.sku}</Text>
                {/* <InputField value={product?.sku} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Brand: {product?.brand}</Text>
                {/* <InputField value={product?.brand} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Price: {product?.price}</Text>
                {/* <InputField value={product?.price} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Sale Price: {product?.sale_price}</Text>
                {/* <InputField value={product?.sale_price} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Cost Price: {product?.cost_price}</Text>
                {/* <InputField value={product?.cost_price} /> */}
              </View>
              {/* <View style={styles.inputField}>
                <Text style={styles.formLabel}>Quantity:</Text>
                <TouchableOpacity
                  style={styles.addOneBtn}
                  onPress={() => { handleSubmit(1) }}
                >
                  <Text style={styles.addOneBtnText}>+ Add 1 Item</Text>
                </TouchableOpacity>
              </View> */}
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Weight: {product?.weight}</Text>
                {/* <QuantityPicker quantity={product?.weight} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Size: {displaySize}</Text>
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Color: {product?.color}</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryTitle}>Quick Info</Text>
                  <Text style={[styles.stockStatusText, { color: stockStatusColor }]}>{stockStatus}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Price</Text>
                  <Text style={styles.summaryValue}>{product?.price || '-'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Today&apos;s Price</Text>
                  <Text style={styles.summaryValue}>{product?.sale_price || product?.price || '-'}</Text>
                </View>
                {hasDiscount && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>You Save</Text>
                    <Text style={styles.summaryValue}>${youSaveAmount}</Text>
                  </View>
                )}
                <View style={styles.summaryChips}>
                  <View style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>Brand: {product?.brand || '-'}</Text>
                  </View>
                  <View style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>Size: {displaySize || '-'}</Text>
                  </View>
                  <View style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>Color: {product?.color || '-'}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.bottomAddToCartButton}
                onPress={() => { handleSubmit(1) }}
                activeOpacity={0.8}
              >
                <Text style={styles.bottomAddToCartButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default ProductDetailScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  quickAddButton: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  quickAddButtonText: {
    color: AppColors.blue,
    fontSize: 14,
  },
  editIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCartIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: AppColors.white,
    fontSize: 10,
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
  circle: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.blue,
    fontSize: 32,
    marginTop: 60,
  },
  pinkLeaf: {
    position: 'relative',
    zIndex: -1,
    top: -68,
    right: -40
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 24,
  },
  scrollView: {},
  scrollContent: {
    paddingBottom: 120,
  },
  heroImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroImage: {
    width: 296,
    height: 296,
    borderRadius: 16,
  },
  heroImageThumbnails: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  thumbnail: {
    width: 56,
    height: 56,
    marginRight: 8,
    borderRadius: 8,
  },
  selectedThumbnail: {
    borderWidth: 2,
    borderColor: AppColors.blue,
  },
  content: {
    marginTop: 24,
  },
  productTitle: {
    fontSize: 20,
    color: AppColors.blue
  },
  descriptionBlock: {
    marginTop: 16,
    marginBottom: 8,
    // height: 200,
  },
  descriptionScroll: {
    flex: 1,
    lineHeight: 24,
  },
  productDesc: {
    lineHeight: 24,
    color: '#333',
  },
  formLabel: {
    marginBottom: 8,
  },
  inputField: {
    marginBottom: 8,
  },
  summaryCard: {
    marginTop: 20,
    backgroundColor: AppColors.grey,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  summaryTitle: {
    color: AppColors.blue,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  stockStatusText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  summaryLabel: {
    color: AppColors.primary,
    fontSize: 13,
  },
  summaryValue: {
    color: AppColors.blue,
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  summaryChips: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryChip: {
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summaryChipText: {
    color: AppColors.primary,
    fontSize: 12,
  },
  bottomAddToCartButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 248,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  bottomAddToCartButtonText: {
    color: AppColors.white,
    fontSize: 16,
  },
})

const tagsStyles = {
  p: {
    color: AppColors.primary,
    lineHeight: 20,
    marginBottom: 10,
  },
  h1: {
    color: '#111111',
    marginBottom: 15,
  },
  h2: {
    color: '#333333',
    marginBottom: 12,
  },
  h3: {
    color: '#555555',
    marginBottom: 10,
  },
  ul: {
    marginBottom: 10,
  },
  li: {
    color: AppColors.primary,
    lineHeight: 20,
  },
  b: {
    fontWeight: 'bold',
  },
  strong: {
    fontWeight: 'bold',
  },
  i: {
    fontStyle: 'italic',
  },
  em: {
    fontStyle: 'italic',
  },
  u: {
    textDecorationLine: 'underline',
  },
  s: {
    textDecorationLine: 'line-through',
  },
  del: {
    textDecorationLine: 'line-through',
  },
};
