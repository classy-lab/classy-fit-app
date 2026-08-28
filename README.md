# Classy Fit

Classy Fit is a React Native application for gym owners, trainers, and members. It supports gym operations such as memberships, products, classes, private training, earnings, expenses, equipment, contacts, and notifications, along with public gym information and authentication flows.

## Technology

- React Native `0.81.5`
- Expo `54`
- React `19`
- TypeScript
- React Navigation
- React Hook Form and Yup

## Prerequisites

- Node.js and npm
- For iOS: macOS, Xcode, and CocoaPods
- For Android: Android Studio and an Android emulator or device
- Access to the Classy Fit API configured for the development environment

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/classy-lab/classy-fit-app.git
   cd classy-fit-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   The `postinstall` script applies the required local patch for `react-native-date-picker`.

3. Configure the API connection using the project’s existing `UserContext` configuration before running the app.

## Running the app

Start the Expo development server:

```bash
npm start
```

Run the web version:

```bash
npm run web
```

Run on Android:

```bash
npm run android
```

Run on the configured iOS simulator:

```bash
npm run ios
```

## Project structure

```text
src/
├── components/     Reusable UI components and form controls
├── context/        Shared application and authentication state
├── navigation/     Authentication, tab, and stack navigators
├── screens/        Authentication and application screens
└── styles/         Shared colors and styles
assets/             Images, icons, and SVG assets
ios/                iOS native project
android/            Android native project
```

## Navigation

- `AuthStack` contains login, registration, and public screens.
- `AppTabs` contains the authenticated Home, Gym, Staff, and Products tabs.
- Feature-specific screens are registered in their corresponding stack navigator.

## Development notes

- Keep API requests authenticated with the access token from `UserContext`.
- Reuse shared form schemas and components where possible.
- Do not commit credentials, tokens, or environment-specific secrets.

## Troubleshooting

- If native dependencies are out of sync, reinstall JavaScript dependencies and run CocoaPods for iOS:

  ```bash
  npm install
  cd ios && pod install && cd ..
  ```

- If the Metro bundler has stale state, restart it with:

  ```bash
  npx expo start --clear
  ```
