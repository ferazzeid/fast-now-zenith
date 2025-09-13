# Welcome to Fast Now

Fast Now is a comprehensive nutrition and meal tracking application that helps you maintain a healthy lifestyle through intelligent food logging, meal planning, and nutritional insights.

## Features

- **Smart Food Library**: Extensive database of foods with detailed nutritional information
- **Quick Logging**: Fast and intuitive meal and food entry
- **Nutritional Tracking**: Monitor calories, macronutrients, and micronutrients
- **Meal Planning**: Plan your meals in advance for better nutrition management
- **Progress Insights**: Track your nutritional goals and progress over time
- **Cross-Platform**: Available on web, iOS, and Android

## Development

This project uses **npm** for package management.

```bash
npm install      # install dependencies
npm run dev      # start the development server
```

## Building the Android AAB

To build the Android App Bundle (AAB) from a fresh git clone:

### Prerequisites
- Node.js and npm installed
- Android Studio with Android SDK
- Java 21 installed and configured

### Build Steps
```bash
# 1. Install dependencies
npm install

# 2. Build the web assets
npm run build

# 3. Sync Capacitor to generate Android files
npx cap sync android

# 4. Navigate to Android directory
cd android

# 5. Make gradlew executable (on macOS/Linux)
chmod +x ./gradlew

# 6. Build the release AAB
./gradlew bundleRelease
```

### Output Location
The generated AAB file will be located at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Troubleshooting
- If you get "Gradle wrapper not found" errors, run `./gradlew wrapper` first
- For "Permission denied" errors on gradlew, run `chmod +x ./gradlew`
- If build fails, try `./gradlew clean` then retry the build

### Version Management
Before each release, update the version in `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 51  // Increment for each release
    versionName "51"  // Update version string
}
```

Start your journey to better nutrition with Fast Now - making healthy eating simple and sustainable.
