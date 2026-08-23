// @ts-nocheck
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import { useCart } from '../../context/CartContext'

const ViewCartScreen = () => {
  const navigation = useNavigation()
  const { items, totalCost, totalItemCount, updateQuantity, removeFromCart, clearCart } = useCart()
  const hasItems = items.length > 0
  const currencyTotal = `$${totalCost.toFixed(2)}`

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <View style={styles.headingContainer}>
              <Text style={styles.title}>Your Cart</Text>
              <View style={styles.itemCountPill}>
                <Text style={styles.itemCountPillText}>{totalItemCount} item{totalItemCount === 1 ? '' : 's'}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.body]}>
            {!hasItems ? (
              <View style={styles.emptyStateCard}>
                <Feather name="shopping-bag" size={28} color={AppColors.blue} />
                <Text style={styles.emptyText}>Your cart is empty.</Text>
                <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.navigate('ProductsScreen')}>
                  <Text style={styles.continueBtnText}>Continue Shopping</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {items.map((item) => (
                  <View style={styles.cartRow} key={item.productId}>
                    {item.imageUrl ? (
                      <Image style={styles.cartItemImage} source={{ uri: item.imageUrl }} />
                    ) : (
                      <View style={styles.cartItemImagePlaceholder} />
                    )}
                    <View style={styles.cartItemMeta}>
                      <View style={styles.cartItemHeader}>
                        <Text style={styles.cartItemTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.cartItemLineTotal}>${(item.unitPrice * item.quantity).toFixed(2)}</Text>
                      </View>
                      <Text style={styles.cartItemSubtitle}>SKU: {item.sku}</Text>
                      <Text style={styles.cartItemSubtitle}>${item.unitPrice.toFixed(2)} each</Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.productId)}>
                          <Text style={styles.removeText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue}>{currencyTotal} USD</Text>
              </View>
              {hasItems && (
                <TouchableOpacity onPress={clearCart}>
                  <Text style={styles.clearCartText}>Clear Cart</Text>
                </TouchableOpacity>
              )}
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.registerBtn, !hasItems && styles.disabledBtn]}
                  title="Proceed to Checkout"
                  disabled={!hasItems}
                  onPress={() => {
                    navigation.navigate('ThankYouScreen')
                    clearCart()
                  }}
                >
                  <Text style={styles.registerBtnText}>Proceed to Checkout</Text>
                </TouchableOpacity>
              </View>
              <Image style={styles.paymentIcons} source={require('../../assets/images/products/payment-icons.png')} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default ViewCartScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    // borderWidth: 1, borderColor: 'red'
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerCard: {
    marginTop: 8,
    marginBottom: 12,
  },
  headingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 8,
  },
  title: {
    color: AppColors.blue,
    fontSize: 30,
    marginTop: 16,
  },
  itemCountPill: {
    backgroundColor: AppColors.grey,
    borderColor: AppColors.textInputBorderColor,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  itemCountPillText: {
    color: AppColors.primary,
    fontSize: 13,
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
  },
  emptyStateCard: {
    backgroundColor: AppColors.grey,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  bodyText: {
    color: AppColors.blue,
    fontSize: 28,
    textAlign: 'center',
  },
  emptyText: {
    color: AppColors.primary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  continueBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 24,
    paddingHorizontal: 18,
    height: 42,
    justifyContent: 'center',
  },
  continueBtnText: {
    color: AppColors.white,
    fontSize: 14,
  },
  cartRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  cartItemImage: {
    width: 76,
    height: 76,
    borderRadius: 10,
    marginRight: 10,
  },
  cartItemImagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: AppColors.textInputBorderColor,
  },
  cartItemMeta: {
    flex: 1,
  },
  cartItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    columnGap: 8,
  },
  cartItemTitle: {
    color: AppColors.blue,
    flexShrink: 1,
  },
  cartItemLineTotal: {
    color: AppColors.blue,
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
  },
  cartItemSubtitle: {
    color: AppColors.primary,
    fontSize: 12,
    marginBottom: 2,
  },
  quantityControls: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
  qtyBtnText: {
    color: AppColors.blue,
    fontSize: 16,
  },
  qtyText: {
    color: AppColors.blue,
    minWidth: 20,
    textAlign: 'center',
    fontFamily: 'Montserrat-Bold',
  },
  removeBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeText: {
    color: AppColors.red,
    fontSize: 12,
  },
  summaryCard: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: AppColors.primary,
    fontSize: 15,
  },
  summaryValue: {
    color: AppColors.blue,
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
  },
  row: {
    alignItems: 'center',
    marginTop: 8,
  },
  registerBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 248,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnText: {
    fontSize: 16,
    color: '#fff',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  clearCartText: {
    color: AppColors.red,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  paymentIcons: {
    marginTop: 20,
    alignSelf: 'center',
  },
})
