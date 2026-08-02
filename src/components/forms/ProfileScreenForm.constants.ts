import * as yup from "yup";

export const phoneRegExp =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

export const MIN_SUBMISSION_TIME_MS = 2000;
export const MAX_PROFILE_PIC_BYTES = 5 * 1024 * 1024;

const createProfilePicSchema = ({ required = false } = {}) =>
  yup
    .mixed()
    .test("required", "A profile picture is required", (value: any) => {
      if (!required) return true;
      if (!value) return false;
      return Boolean(
        value.path || value.uri || value.filename || value.mime || value.type,
      );
    })
    .test("fileSize", "Image is too large (max 5MB)", (value: any) => {
      if (!value) return true;
      const fileSize = value.fileSize ?? value.size;
      if (!fileSize) return true;
      return fileSize <= MAX_PROFILE_PIC_BYTES;
    })
    .test("fileType", "A JPG or PNG profile picture is required", (value: any) => {
      if (!value) return !required;
      if (value.isLocalAvatar) return true;
      const filename = (
        value.filename || value.path || value.uri || ""
      ).toLowerCase();
      return (
        filename.endsWith(".jpg") ||
        filename.endsWith(".jpeg") ||
        filename.endsWith(".png")
      );
    });

export const schema = yup.object().shape({
  profilePic: createProfilePicSchema({ required: true }),
  email: yup.string().required("Email is required").email("Invalid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(12, "Password must contain at least 12 characters")
    .matches(
      /^[a-zA-Z0-9\s~!@#$%^&*()_+-]+$/,
      "Only letters, numbers, spaces, hyphens, and underscores are allowed",
    ),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
  role: yup.string(),
  fname: yup.string().required("First name is required").min(2).max(20),
  lname: yup.string().required("Last name is required").min(2).max(20),
  company: yup.string().nullable().notRequired(),
  job: yup.string().nullable().notRequired(),
  dateOfBirth: yup
    .string()
    .matches(
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
      "Date must be in YYYY-MM-DD format",
    )
    .required("Date of birth is required"),
  sex: yup.string(),
  phoneNumber: yup
    .string()
    .matches(phoneRegExp, "Phone Number is not valid")
    .transform((value) => (value === "" ? "" : value))
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be no more than 15 digits')
    .matches(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number'),
  whatsappNumber: yup
    .string()
    .matches(phoneRegExp, "WhatsApp Number number is not valid")
    .nullable()
    .notRequired()
    .transform((value) => (value === "" ? null : value)),
  preferredContact: yup.string(),
  gymId: yup.string().matches(/^\d+$/, "Gym location is required"),
});

export const updateContactSchema = yup.object().shape({
  profilePic: createProfilePicSchema(),
  email: yup.string().required("Email is required").email("Invalid email"),
  role: yup.string(),
  fname: yup.string().required("First name is required").min(2).max(20),
  lname: yup.string().required("Last name is required").min(2).max(20),
  company: yup.string().nullable().notRequired(),
  job: yup.string().nullable().notRequired(),
  sex: yup.string(),
  phoneNumber: yup
    .string()
    .matches(phoneRegExp, "Phone Number is not valid")
    .transform((value) => (value === "" ? "" : value))
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be no more than 15 digits')
    .matches(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number'),
  whatsappNumber: yup
    .string()
    .matches(phoneRegExp, "WhatsApp Number number is not valid")
    .nullable()
    .notRequired()
    .transform((value) => (value === "" ? null : value)),
  preferredContact: yup.string(),
  gymId: yup.string().matches(/^\d+$/, "Gym location is required"),
});

export const createContactSchema = yup.object().shape({
  profilePic: createProfilePicSchema({ required: true }),
  email: yup.string().required("Email is required").email("Invalid email"),
  role: yup.string(),
  fname: yup.string().required("First name is required").min(2).max(20),
  lname: yup.string().required("Last name is required").min(2).max(20),
  company: yup.string().nullable().notRequired(),
  job: yup.string().nullable().notRequired(),
  sex: yup.string(),
  phoneNumber: yup
    .string()
    .matches(phoneRegExp, "Phone Number is not valid")
    .transform((value) => (value === "" ? "" : value))
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be no more than 15 digits')
    .matches(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number'),
  whatsappNumber: yup
    .string()
    .matches(phoneRegExp, "WhatsApp Number number is not valid")
    .nullable()
    .notRequired()
    .transform((value) => (value === "" ? null : value)),
  preferredContact: yup.string(),
  gymId: yup.string().matches(/^\d+$/, "Gym location is required"),
});

export const sexData = [
  { key: "1", value: "Male", disabled: false },
  { key: "2", value: "Female" },
  { key: "3", value: "Other" },
];

export const roleData = [
  { key: "1", value: "Owner", disabled: false },
  { key: "2", value: "Member" },
  { key: "3", value: "Trainer" },
  { key: "4", value: "Contractor" },
];

export const findRoleOption = (role?: string | null) => {
  if (!role) return undefined;

  return roleData.find(
    (item) => item.key === String(role) || item.value === role,
  );
};

export const normalizeRole = (role?: string | null) => {
  return findRoleOption(role)?.value || role || "";
};

export const localAvatarOptions = [
  {
    key: "avatar-1",
    name: "beard-hipster-male.png",
    asset: require("../../assets/images/avatars/beard-hipster-male.png"),
  },
  {
    key: "avatar-2",
    name: "boy-indian-kid.png",
    asset: require("../../assets/images/avatars/boy-indian-kid.png"),
  },
  {
    key: "avatar-3",
    name: "boy-kid.png",
    asset: require("../../assets/images/avatars/boy-kid.png"),
  },
  {
    key: "avatar-4",
    name: "boy-male.png",
    asset: require("../../assets/images/avatars/boy-male.png"),
  },
  {
    key: "avatar-5",
    name: "indian-male-man.png",
    asset: require("../../assets/images/avatars/indian-male-man.png"),
  },
  {
    key: "avatar-6",
    name: "indian-man-sikh.png",
    asset: require("../../assets/images/avatars/indian-man-sikh.png"),
  },
  {
    key: "avatar-7",
    name: "person-pilot.png",
    asset: require("../../assets/images/avatars/person-pilot.png"),
  },
  {
    key: "avatar-8",
    name: "apple-avatar-illness.png",
    asset: require("../../assets/images/avatars/apple-avatar-illness.png"),
  },
  {
    key: "avatar-9",
    name: "addicted-draw-love.png",
    asset: require("../../assets/images/avatars/addicted-draw-love.png"),
  },
  {
    key: "avatar-10",
    name: "avatar-cloud-crying.png",
    asset: require("../../assets/images/avatars/avatar-cloud-crying.png"),
  },
  {
    key: "avatar-11",
    name: "christmas-clous-santa.png",
    asset: require("../../assets/images/avatars/christmas-clous-santa.png"),
  },
  {
    key: "avatar-12",
    name: "avatar-elderly-grandma.png",
    asset: require("../../assets/images/avatars/avatar-elderly-grandma.png"),
  },
  {
    key: "avatar-13",
    name: "afro-female-person.png",
    asset: require("../../assets/images/avatars/afro-female-person.png"),
  },
  {
    key: "avatar-14",
    name: "avatar-nun-sister.png",
    asset: require("../../assets/images/avatars/avatar-nun-sister.png"),
  },
  // {
  //   key: "avatar-15",
  //   name: "avatar-male-ozzy.png",
  //   asset: require("../../assets/images/avatars/avatar-male-ozzy.png"),
  // },
  {
    key: "avatar-16",
    name: "avatar-man-person.png",
    asset: require("../../assets/images/avatars/avatar-man-person.png"),
  },
  {
    key: "avatar-17",
    name: "builder-helmet-worker.png",
    asset: require("../../assets/images/avatars/builder-helmet-worker.png"),
  },
  {
    key: "avatar-18",
    name: "avatar-dead-monster.png",
    asset: require("../../assets/images/avatars/avatar-dead-monster.png"),
  },
  {
    key: "avatar-19",
    name: "avatar-female-girl.png",
    asset: require("../../assets/images/avatars/avatar-female-girl.png"),
  },
  {
    key: "avatar-20",
    name: "avatar-child-girl.png",
    asset: require("../../assets/images/avatars/avatar-child-girl.png"),
  },
  {
    key: "avatar-21",
    name: "child-girl-kid.png",
    asset: require("../../assets/images/avatars/child-girl-kid.png"),
  },
  {
    key: "avatar-22",
    name: "avatar-cacti-cactus.png",
    asset: require("../../assets/images/avatars/avatar-cacti-cactus.png"),
  },
  {
    key: "avatar-23",
    name: "avatar-female-portrait.png",
    asset: require("../../assets/images/avatars/avatar-female-portrait.png"),
  },
  {
    key: "avatar-24",
    name: "avatar-geisha-japanese.png",
    asset: require("../../assets/images/avatars/avatar-geisha-japanese.png"),
  },
  {
    key: "avatar-26",
    name: "avatar-bad-breaking.png",
    asset: require("../../assets/images/avatars/avatar-bad-breaking.png"),
  },
  {
    key: "avatar-27",
    name: "avatar-female-portrait-2.png",
    asset: require("../../assets/images/avatars/avatar-female-portrait-2.png"),
  },
  {
    key: "avatar-29",
    name: "avatar-man-muslim.png",
    asset: require("../../assets/images/avatars/avatar-man-muslim.png"),
  },
  {
    key: "avatar-30",
    name: "animal-avatar-bear.png",
    asset: require("../../assets/images/avatars/animal-avatar-bear.png"),
  },
  {
    key: "avatar-31",
    name: "animal-avatar-mutton.png",
    asset: require("../../assets/images/avatars/animal-avatar-mutton.png"),
  },
];