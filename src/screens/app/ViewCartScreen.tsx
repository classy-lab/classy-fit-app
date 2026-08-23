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
  const currencyTotal = `$${totalCost.toFixed(2)} USD`

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Your Cart</Text>
          </View>
          <View style={[styles.body]}>
            {!hasItems ? (
              <Text style={styles.emptyText}>Your cart is empty.</Text>
            ) : (
              <>
                <Text style={styles.itemCountText}>Items: {totalItemCount}</Text>
                {items.map((item) => (
                  <View style={styles.cartRow} key={item.productId}>
                    {item.imageUrl ? (
                      <Image style={styles.cartItemImage} source={{ uri: item.imageUrl }} />
                    ) : (
                      <View style={styles.cartItemImagePlaceholder} />
                    )}
                    <View style={styles.cartItemMeta}>
                      <Text style={styles.cartItemTitle} numberOfLines={1}>{item.title}</Text>
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
                        <TouchableOpacity onPress={() => removeFromCart(item.productId)}>
                          <Text style={styles.removeText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
            <Text style={styles.bodyText}>
              {currencyTotal}
            </Text>
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
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.primary,
    fontSize: 32,
    marginTop: 60,
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    // flex: 1,
  },
  bodyText: {
    color: AppColors.blue,
    fontSize: 32,
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center'
  },
  itemCountText: {
    color: AppColors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: AppColors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  cartRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  cartItemImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 10,
  },
  cartItemImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: AppColors.textInputBorderColor,
  },
  cartItemMeta: {
    flex: 1,
  },
  cartItemTitle: {
    color: AppColors.blue,
    marginBottom: 2,
  },
  cartItemSubtitle: {
    color: AppColors.primary,
    fontSize: 12,
    marginBottom: 2,
  },
  quantityControls: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    color: AppColors.blue,
    fontSize: 14,
  },
  qtyText: {
    color: AppColors.blue,
    minWidth: 14,
    textAlign: 'center',
  },
  removeText: {
    color: AppColors.red,
    fontSize: 12,
  },
  row: {
    alignItems: 'center',
    marginTop: 24,
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
    color: '#fff'
  },
  disabledBtn: {
    opacity: 0.5,
  },
  clearCartText: {
    color: AppColors.red,
    textAlign: 'center',
    marginBottom: 8,
  },
  paymentIcons: {
    marginTop: 24,
    alignSelf: 'center'
  }
})
