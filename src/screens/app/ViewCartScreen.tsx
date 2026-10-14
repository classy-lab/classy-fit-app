// @ts-nocheck
import { useContext, useState } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import { useCart } from '../../context/CartContext'
import { UserContext } from '../../context/UserContext'
import { showMessage } from 'react-native-flash-message'
import { useStripe } from '@stripe/stripe-react-native'

const normalizeToken = (value) => String(value ?? '').trim()

const refreshAccessTokenWithRefresh = async ({
  refreshToken,
  webServer,
  setTokens,
}) => {
  const effectiveRefreshToken = normalizeToken(refreshToken)
  if (!effectiveRefreshToken) {
    return null
  }

  const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: effectiveRefreshToken,
    }),
  })

  if (!refreshResponse.ok) {
    return null
  }

  const refreshObj = await refreshResponse.json()
  if (!refreshObj?.access_token || !refreshObj?.refresh_token) {
    return null
  }

  const nextTokens = {
    access_token: refreshObj.access_token,
    refresh_token: refreshObj.refresh_token,
  }

  setTokens((prev) => ({
    ...(prev ?? {}),
    access_token: nextTokens.access_token,
    refresh_token: nextTokens.refresh_token,
  }))

  return nextTokens.access_token
}

const performAuthenticatedRequestWithRefresh = async ({
  endpoint,
  init = {} as RequestInit,
  accessToken,
  refreshToken,
  webServer,
  setTokens,
}) => {
  const requestAccessToken = normalizeToken(accessToken)
  if (!requestAccessToken) {
    return null
  }

  const requestWithToken = async (token) => {
    const headers = new Headers(init.headers ?? undefined)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    headers.set('Authorization', `Bearer ${token}`)

    return fetch(endpoint, {
      ...init,
      headers,
    })
  }

  const response = await requestWithToken(requestAccessToken)
  if (response.ok) {
    return response
  }

  await refreshAccessTokenWithRefresh({
    refreshToken,
    webServer,
    setTokens,
  })

  return response
}

const ViewCartScreen = () => {
  const navigation = useNavigation()
  const { user } = useContext(UserContext)
  const { tokens, setTokens, webServer, stripePublishableKey } = useContext(UserContext)
  const { items, totalCost, totalItemCount, updateQuantity, removeFromCart, clearCart } = useCart()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const hasItems = items.length > 0
  const currencyTotal = `$${totalCost.toFixed(2)}`
  const canCheckout = hasItems && !isSubmittingOrder

  const buildOrderNumber = () => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const mi = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')
    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase()
    return `ORD-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${randomSuffix}`
  }

  const buildCreateOrderPayload = () => {
    const subtotalAmount = Number(totalCost.toFixed(2))
    const orderNumber = buildOrderNumber()
    const checkoutKey = `checkout_${orderNumber}_${Date.now()}`
    const givenName = String(user?.given_name ?? '').trim()
    const familyName = String(user?.family_name ?? '').trim()
    const email = String(user?.email ?? '').trim().toLowerCase()
    const firstName = givenName || 'Member'
    const lastName = familyName || 'User'
    const customerEmail = email || `user-${user?.sub ?? 'unknown'}@example.com`

    const userUid = Number(user?.sub ?? 0)
    const orderItems = items.map((item) => ({
      product_uid: Number(item.productId),
      product_title: item.title,
      product_sku: item.sku,
      product_brand: null,
      quantity: Number(item.quantity),
      unit_price: Number(item.unitPrice.toFixed(2)),
      cost_price_snapshot: null,
    }))

    return {
      user_uid: userUid,
      order_number: orderNumber,
      checkout_idempotency_key: checkoutKey,
      currency_code: 'USD',
      customer_first_name: firstName,
      customer_last_name: lastName,
      customer_email: customerEmail,
      customer_phone: user?.phone ? String(user.phone) : null,
      shipping_method_uid: null,
      shipping_method_code: null,
      shipping_method_name: null,
      subtotal_amount: subtotalAmount,
      discount_amount: 0,
      tax_amount: 0,
      shipping_amount: 0,
      total_amount: subtotalAmount,
      customer_notes: null,
      items: orderItems,
    }
  }

  const submitOrderRequest = async (payload: any) => {
    if (!user?.gym_id || !tokens?.access_token) {
      showMessage({
        message: 'Checkout unavailable',
        description: 'Missing gym or login session. Please sign in again.',
        type: 'danger',
      })
      return null
    }

    if (!Number.isFinite(payload.user_uid) || payload.user_uid <= 0) {
      showMessage({
        message: 'Checkout unavailable',
        description: 'Invalid user id in session. Please sign in again.',
        type: 'danger',
      })
      return null
    }

    if (payload.items.some((item) => !Number.isFinite(item.product_uid) || item.product_uid <= 0)) {
      showMessage({
        message: 'Checkout unavailable',
        description: 'One or more cart items have invalid product ids.',
        type: 'danger',
      })
      return null
    }

    const endpoint = `${webServer}/api/v1/gyms/${user.gym_id}/checkout/payment-intent`
    const response = await performAuthenticatedRequest({
      endpoint,
      init: {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      webServer,
      setTokens,
    })

    if (!response) {
      showMessage({
        message: 'Session expired',
        description: 'Please sign in again.',
        type: 'danger',
      })
      return null
    }

    const shouldShowSessionExpired = response.status === 401 || response.status === 403

    const text = await response.text()
    let responseBody: any = {}
    if (text) {
      try {
        responseBody = JSON.parse(text)
      } catch (parseError) {
        responseBody = { message: text }
      }
    }

    if (shouldShowSessionExpired) {
      showMessage({
        message: 'Session expired',
        description: 'Please sign in again.',
        type: 'danger',
      })
      return null
    }

    return { response, responseBody }
  }

  const submitOrder = async () => {
    if (!canCheckout) {
      return
    }

    if (!stripePublishableKey || stripePublishableKey === 'pk_test_placeholder') {
      showMessage({
        message: 'Checkout unavailable',
        description: 'Stripe configuration not available. Please contact support.',
        type: 'danger',
      })
      return
    }

    setIsSubmittingOrder(true)

    try {
      const payload = buildCreateOrderPayload()
      const initialCheckoutResult = await submitOrderRequest(payload)
      if (!initialCheckoutResult) {
        return
      }

      let { response, responseBody } = initialCheckoutResult

      if (response.status !== 200 && response.status !== 201) {
        showMessage({
          message: responseBody?.message || 'Checkout failed',
          description: Array.isArray(responseBody?.errors) ? responseBody.errors.join('\n') : 'Please try again.',
          type: 'danger',
        })
        return
      }

      const clientSecret = responseBody?.payment_intent?.client_secret
      if (!clientSecret) {
        showMessage({
          message: 'Checkout failed',
          description: 'Payment initialization failed. Please try again.',
          type: 'danger',
        })
        return
      }

      const orderInfo = {
        order_uid: responseBody?.order_uid,
        order_number: responseBody?.order_number,
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Classy Fit',
        style: 'alwaysDark',
        returnURL: 'classyfit://stripe-redirect',
      })

      if (initError) {
        console.log('Payment Sheet init error:', initError)
        showMessage({
          message: 'Payment setup failed',
          description: 'Unable to initialize payment sheet. Please try again.',
          type: 'danger',
        })
        return
      }

      const { error: presentError } = await presentPaymentSheet()

      if (presentError) {
        if (presentError.code === 'Canceled') {
          return
        }

        console.log('Payment Sheet error:', presentError)
        showMessage({
          message: 'Payment failed',
          description: presentError.message || 'The payment could not be processed. Please try again.',
          type: 'danger',
        })
        return
      }

      const reconciliationResult = await submitOrderRequest(payload)
      if (!reconciliationResult) {
        return
      }

      if (reconciliationResult.response.status === 200 || reconciliationResult.response.status === 201) {
        response = reconciliationResult.response
        responseBody = reconciliationResult.responseBody
      }

      const reconciledOrderStatus = String(responseBody?.order_status ?? '').toLowerCase()
      const reconciledPaymentStatus = String(responseBody?.payment_status ?? '').toLowerCase()
      const isConfirmed = reconciledOrderStatus === 'confirmed' || reconciledPaymentStatus === 'paid'

      if (!isConfirmed) {
        showMessage({
          message: 'Payment processing',
          description: 'Your payment was submitted and is being confirmed.',
          type: 'info',
        })
        return
      }

      clearCart()
      showMessage({
        message: 'Payment successful',
        description: `Order #${responseBody?.order_number ?? orderInfo.order_number} has been placed.`,
        type: 'success',
      })

      navigation.navigate('ThankYouScreen', {
        orderInfo: {
          order_uid: responseBody?.order_uid ?? orderInfo.order_uid,
          order_number: responseBody?.order_number ?? orderInfo.order_number,
        },
      })
    } catch (error) {
      console.log('Checkout error:', error)
      showMessage({
        message: 'Checkout failed',
        description: 'An unexpected error occurred. Please try again.',
        type: 'danger',
      })
    } finally {
      setIsSubmittingOrder(false)
    }
  }

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
                  style={[styles.registerBtn, !canCheckout && styles.disabledBtn]}
                  title="Proceed to Checkout"
                  disabled={!canCheckout}
                  onPress={submitOrder}
                >
                  <Text style={styles.registerBtnText}>{isSubmittingOrder ? 'Processing...' : 'Proceed to Checkout'}</Text>
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