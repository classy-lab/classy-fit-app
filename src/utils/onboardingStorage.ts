type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const ONBOARDING_COMPLETED_KEY = "classy_fit_onboarding_completed_v1";

let storage: StorageLike | null = null;
try {
  // Keep startup safe even if the native module is unavailable in a given runtime.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require("@react-native-async-storage/async-storage");
  const candidate = module?.default ?? module;
  if (candidate?.getItem && candidate?.setItem) {
    storage = candidate as StorageLike;
  }
} catch (error) {
  storage = null;
}

export const getOnboardingCompleted = async (): Promise<boolean> => {
  if (!storage) {
    return false;
  }

  const storedValue = await storage.getItem(ONBOARDING_COMPLETED_KEY);
  return storedValue === "true";
};

export const markOnboardingCompleted = async (): Promise<void> => {
  if (!storage) {
    return;
  }

  await storage.setItem(ONBOARDING_COMPLETED_KEY, "true");
};

export { ONBOARDING_COMPLETED_KEY };
