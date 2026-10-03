import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { categoryCards, formatDateTime, formatMoney, getInitials } from '../../utils/earningsShared'
import type { EarningsCategoryKey, EarningsTransaction } from '../../types/earnings'

const EVENT_LABELS: Record<EarningsCategoryKey, string> = {
  memberships: 'Membership starts',
  classes: 'Class time',
  personal_training: 'Session time',
  products: '',
}

const TransactionRow = ({
  transaction,
  category,
  color,
  expanded,
  onToggle,
  showCategory = false,
}: {
  transaction: EarningsTransaction
  category: EarningsCategoryKey
  color: string
  expanded: boolean
  onToggle: () => void
  showCategory?: boolean
}) => {
  const summaryParts = [transaction.item_name]
  if (transaction.item_detail) {
    summaryParts.push(transaction.item_detail)
  }
  if (transaction.quantity) {
    summaryParts.push(`${transaction.quantity} ${transaction.quantity === 1 ? 'item' : 'items'}`)
  }

  const details = [
    transaction.customer.email ? { label: 'Email', value: transaction.customer.email } : null,
    transaction.reference ? { label: 'Order', value: transaction.reference } : null,
    transaction.event_at && EVENT_LABELS[category]
      ? { label: EVENT_LABELS[category], value: formatDateTime(transaction.event_at) }
      : null,
    { label: 'Paid', value: formatDateTime(transaction.paid_at) },
    { label: 'Payment ID', value: `#${transaction.payment_uid}` },
  ].filter(Boolean)

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      style={[styles.txRow, expanded && styles.txRowExpanded]}
    >
      <View style={styles.txMain}>
        <View style={[styles.txAvatar, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.txAvatarText, { color }]}>
            {getInitials(transaction.customer.name)}
          </Text>
        </View>

        <View style={styles.txBody}>
          <View style={styles.txNameRow}>
            <Text style={styles.txName} numberOfLines={1}>
              {transaction.customer.name}
            </Text>
            {showCategory ? (
              <View style={[styles.txBadge, { backgroundColor: `${color}22` }]}>
                <Text style={[styles.txBadgeText, { color }]} numberOfLines={1}>
                  {categoryCards[category].title}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.txItem} numberOfLines={expanded ? 3 : 1}>
            {summaryParts.join(' · ')}
          </Text>
        </View>

        <View style={styles.txRight}>
          <Text style={styles.txAmount}>{formatMoney(transaction.amount, transaction.currency)}</Text>
          <Text style={styles.txDate}>{formatDateTime(transaction.paid_at)}</Text>
        </View>

        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={AppColors.grey2}
          style={styles.txChevron}
        />
      </View>

      {expanded ? (
        <View style={styles.txDetails}>
          {details.map((detail) => (
            <View key={detail.label} style={styles.txDetailRow}>
              <Text style={styles.txDetailLabel}>{detail.label}</Text>
              <Text style={styles.txDetailValue} numberOfLines={2}>
                {detail.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

export default TransactionRow

const styles = StyleSheet.create({
  txRow: {
    backgroundColor: AppColors.grey,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  txRowExpanded: {
    shadowColor: AppColors.grey3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  txMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txAvatarText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
  },
  txBody: {
    flex: 1,
    marginRight: 8,
  },
  txNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txName: {
    flexShrink: 1,
    color: AppColors.blue,
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
  },
  txBadge: {
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  txBadgeText: {
    fontSize: 9,
    fontFamily: 'Montserrat-Bold',
  },
  txItem: {
    color: AppColors.grey3,
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Montserrat',
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    color: AppColors.primary,
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  txDate: {
    color: AppColors.grey3,
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'Montserrat',
  },
  txChevron: {
    marginLeft: 6,
  },
  txDetails: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.grey4,
    gap: 6,
  },
  txDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  txDetailLabel: {
    color: AppColors.grey3,
    fontSize: 11,
    fontFamily: 'Montserrat',
  },
  txDetailValue: {
    flexShrink: 1,
    color: AppColors.blue,
    fontSize: 11,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'right',
  },
})
