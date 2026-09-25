import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SelectList } from 'react-native-dropdown-select-list';
import { AppColors } from '../styles/colors';
import { UserContext } from '../context/UserContext';

type GymListProps = {
  onSelectValue: (value: any) => void;
  initialValue?: any;
};

type GymOption = {
  key: string;
  value: string;
};

const GymList = ({ onSelectValue, initialValue }: GymListProps) => {
  const authContext = useContext(UserContext) as { webServer?: string; user?: { gym_id?: number | string } } | null;
  const webServer = authContext?.webServer ?? '';
  const resolvedInitialValue = initialValue ?? authContext?.user?.gym_id;
  const [gymData, setGymData] = useState<GymOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadGyms = async () => {
      if (!webServer) {
        setGymData([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`${webServer}/api/v1/public/gyms`);
        const body = await response.json().catch(() => ({}));

        if (!isMounted) {
          return;
        }

        if (response.status !== 200) {
          setGymData([]);
          return;
        }

        const gyms = Array.isArray(body?.gyms) ? body.gyms : [];
        setGymData(
          gyms
            .filter((gym: any) => Number(gym?.gym_id) > 0)
            .map((gym: any) => ({
              key: String(gym.gym_id),
              value: [gym.gym_name, gym.city].filter(Boolean).join(', ') || `Gym ${gym.gym_id}`,
            }))
        );
      } catch (error) {
        if (isMounted) {
          setGymData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGyms();

    return () => {
      isMounted = false;
    };
  }, [webServer]);

  const selectedGym = useMemo(
    () => gymData.find((gym) => gym.key === String(resolvedInitialValue || '')),
    [gymData, resolvedInitialValue]
  );

  return (
    <View>
      {loading ? (
        <ActivityIndicator color={AppColors.blue} style={styles.loading} />
      ) : null}
      <SelectList
        setSelected={onSelectValue}
        data={gymData}
        save="key"
        placeholder="Select Gym"
        defaultOption={
          selectedGym
            ? {
                key: selectedGym.key,
                value: selectedGym.value,
              }
            : undefined
        }
        boxStyles={{
          borderColor: AppColors.grey,
          borderWidth: 1,
          paddingHorizontal: 8,
        }}
        dropdownStyles={{
          borderColor: AppColors.grey2,
          borderWidth: 1,
          marginTop: 8,
          backgroundColor: 'white',
        }}
      />
    </View>
  );
};

export default GymList;

const styles = StyleSheet.create({
  loading: {
    marginBottom: 8,
  },
});
