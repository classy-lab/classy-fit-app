import { useCallback, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import { isOwnerRole } from '../../utils/roleAccess'
import { formatUsd } from '../../utils/currency'

type TrainerRate = {
  personal_training_hourly_price: string | null
  has_standard_hourly_rate: boolean
}

type RateFormValues = {
  price: string
}

type UserContextValue = {
  user?: {
    gym_id?: number | string
    role?: string | null
  } | null
  tokens?: {
    access_token?: string
  } | null
  webServer: string
}

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/
const MAX_PRICE = 99999999.99

export const NO_RATE_LABEL = 'No standard hourly rate set.'

const rateSchema = yup.object({
  price: yup
    .string()
    .trim()
    .test('price-format', 'Enter a valid amount with up to 2 decimals', (value) => !value || PRICE_PATTERN.test(value))
    .test('price-max', 'The rate must be $99,999,999.99 or less', (value) => !value || Number(value) <= MAX_PRICE),
})

const formatRate = (rate: TrainerRate | null) =>
  rate?.has_standard_hourly_rate && rate.personal_training_hourly_price !== null
    ? `${formatUsd(rate.personal_training_hourly_price)} per hour`
    : NO_RATE_LABEL

// A rate problem must never read like a failed trainer profile, so these messages always name the hourly rate.
const describeRateLoadFailure = (status: number) => {
  if (status === 401) return 'Please sign in again to view the hourly rate.'
  if (status === 403) return 'You do not have permission to view the hourly rate.'
  if (status === 404) return 'The hourly rate is not available for this trainer in your gym.'

  return 'The hourly rate could not be loaded right now. The rest of this profile is not affected.'
}

const readJson = async (response: Response) => {
  const text = await response.text()
  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

/**
 * The trainer's one standard hourly rate for personal training in this gym, in US dollars. Everyone who can open
 * the staff profile sees it (or "No standard hourly rate set."); only Owners can change it.
 */
const TrainerHourlyRateSection = ({ staffUid }: { staffUid?: number | string | null }) => {
  const { user, tokens, webServer } = useContext(UserContext) as UserContextValue
  const canEdit = isOwnerRole(user?.role)
  const [rate, setRate] = useState<TrainerRate | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [serverMessage, setServerMessage] = useState('')

  const endpoint = `${webServer}/api/v1/gyms/${user?.gym_id}/staff/${staffUid}/personal-training-rate`

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RateFormValues>({
    resolver: yupResolver(rateSchema) as never,
    defaultValues: { price: '' },
    mode: 'onSubmit',
  })

  const applyRate = useCallback(
    (next: TrainerRate | null) => {
      setRate(next)
      reset({ price: next?.personal_training_hourly_price ?? '' })
    },
    [reset]
  )

  useEffect(() => {
    if (!staffUid || !user?.gym_id || !webServer || !tokens?.access_token) {
      setLoading(false)
      return
    }

    let isActive = true

    const loadRate = async () => {
      setLoading(true)
      setLoadError('')

      try {
        const response = await fetch(endpoint, {
          headers: { Authorization: 'Bearer ' + tokens.access_token },
        })
        const body = await readJson(response)

        if (!isActive) {
          return
        }

        if (response.status === 200 && body?.data) {
          applyRate(body.data as TrainerRate)
        } else {
          setLoadError(describeRateLoadFailure(response.status))
        }
      } catch {
        if (isActive) {
          setLoadError(describeRateLoadFailure(0))
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadRate()

    return () => {
      isActive = false
    }
  }, [applyRate, endpoint, reloadKey, staffUid, tokens?.access_token, user?.gym_id, webServer])

  const onSubmit = async (formData: RateFormValues) => {
    if (saving || !tokens?.access_token) {
      return
    }

    const price = String(formData.price ?? '').trim()

    setSaving(true)
    setServerMessage('')

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + tokens.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personal_training_hourly_price: price === '' ? null : price }),
      })
      const body = await readJson(response)

      if (response.status === 200 && body?.data) {
        applyRate(body.data as TrainerRate)
        showMessage({
          message: 'Standard hourly rate saved',
          description: body.data.has_standard_hourly_rate
            ? 'Sessions generated from now on use this rate. Existing sessions and bookings keep their price.'
            : 'The rate was cleared. Availability for this trainer will not generate sessions until a rate is set.',
          type: 'success',
        })
        return
      }

      const message =
        (Array.isArray(body?.errors) && body.errors[0]) ||
        (response.status === 401
          ? 'Please sign in again to update the hourly rate.'
          : response.status === 403
            ? 'Only gym owners can change the hourly rate.'
            : 'The hourly rate could not be saved.')
      setServerMessage(String(message))
      showMessage({ message: 'Save failed', description: String(message), type: 'danger' })
    } catch {
      const message = 'The hourly rate could not be saved.'
      setServerMessage(message)
      showMessage({ message: 'Save failed', description: message, type: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Personal Training Hourly Rate</Text>
      <Text style={styles.helperText}>The rate currently saved for this trainer.</Text>
      <View style={styles.valueBox}>
        {loading ? (
          <ActivityIndicator size="small" color={AppColors.blue} />
        ) : loadError ? (
          <View>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity onPress={() => setReloadKey((key) => key + 1)} activeOpacity={0.8}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.valueText, !rate?.has_standard_hourly_rate && styles.unsetText]}>{formatRate(rate)}</Text>
        )}
      </View>

      {!canEdit && !loading && !loadError ? (
        <Text style={styles.helperText}>Only the gym owner can change a trainer's rate.</Text>
      ) : null}

      {canEdit && !loading && !loadError ? (
        <View>
          <Text style={styles.helperText}>
            Only owners can change a trainer's rate. The box above shows the rate that is saved now; use the field below
            to change it, then press Save. Price is per hour in US dollars (USD) and applies to every availability window
            of this trainer. Leave the field empty and save to clear the rate.
          </Text>
          <Text style={styles.fieldLabel}>New price per hour (USD)</Text>
          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="0.00"
                keyboardType="decimal-pad"
                autoCorrect={false}
                editable={!saving}
              />
            )}
          />
          {errors.price ? <Text style={styles.errorText}>{errors.price.message}</Text> : null}
          {serverMessage ? <Text style={styles.errorText}>{serverMessage}</Text> : null}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            activeOpacity={0.85}
            disabled={saving}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save hourly rate'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  )
}

export default TrainerHourlyRateSection

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  valueBox: {
    backgroundColor: AppColors.grey,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 12,
  },
  valueText: {
    color: AppColors.primary,
  },
  unsetText: {
    color: AppColors.grey3,
    fontStyle: 'italic',
  },
  helperText: {
    marginTop: 12,
    fontSize: 12,
    color: AppColors.grey3,
  },
  fieldLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    borderRadius: 8,
    backgroundColor: AppColors.grey,
    height: 48,
    paddingHorizontal: 8,
    color: AppColors.primary,
  },
  errorText: {
    color: AppColors.red,
    fontSize: 12,
    marginTop: 4,
  },
  retryText: {
    color: AppColors.blue,
    fontSize: 13,
    marginTop: 8,
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: AppColors.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
  },
})
