# Ledger

![Platform](https://img.shields.io/badge/Platform-Android-green)
![Framework](https://img.shields.io/badge/Framework-React%20%2B%20Vite-blue)
![Mobile](https://img.shields.io/badge/Mobile-Capacitor-purple)
![Status](https://img.shields.io/badge/Status-In%20Development-orange)

A habit, goal, and life-tracking app designed to help users organize their daily routines, track progress, and build better habits.

Ledger is a standalone React + Vite project packaged as a mobile application using Capacitor. The app does not use any Claude-specific APIs or AI services. User data is stored locally using browser `localStorage`, which works both in a normal browser environment and inside the WebView used by Capacitor for Android/iOS builds.

---

# 📱 Screenshots

*(Screenshots will be added as development progresses.)*

---

# ✨ Features

## Current Features

* ✅ Habit tracking
* ✅ Goal tracking
* ✅ Life progress tracking
* ✅ Local data storage
* ✅ Offline functionality
* ✅ Responsive user interface
* ✅ Android APK generation
* ✅ Cross-platform foundation using Capacitor

## Planned Features

* ⬜ Habit streak tracking improvements
* ⬜ Notifications and reminders
* ⬜ Calendar integration
* ⬜ Data export/import
* ⬜ Cloud synchronization
* ⬜ Additional analytics and statistics
* ⬜ Custom themes

---

# 🤖 AI Development Disclosure

This project was developed using AI-assisted programming tools.

I was responsible for the application's concept, feature planning, user experience decisions, testing, debugging, and overall direction. AI tools were used as a development assistant for tasks such as code generation, debugging, refactoring, and explaining programming concepts.

All generated code was reviewed, integrated, modified when necessary, and tested as part of the development process.

AI was used as a tool to accelerate development and learning, similar to how developers use documentation, tutorials, and programming assistants.

---

# 🛠️ Tech Stack

## Frontend

* React
* Vite
* JavaScript
* HTML
* CSS

## Mobile Packaging

* Capacitor

## Data Storage

* Browser localStorage

## Development Tools

* Git
* GitHub
* GitHub Actions

---

# 🚀 Fastest Way to Build an Installable APK

No Android Studio, JDK, or Android SDK is required.

This project includes a GitHub Actions workflow:

```
.github/workflows/build-apk.yml
```

which automatically builds an installable Android APK using GitHub's servers.

---

## Step 1: Create a GitHub Repository

Create a new repository on:

```
https://github.com
```

The repository can be either public or private.

---

## Step 2: Push the Project

Open a terminal inside the project folder:

```bash
cd ledger-app

git init

git add .

git commit -m "Initial commit"

git branch -M main

git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

git push -u origin main
```

---

## Step 3: Download the APK

1. Open your GitHub repository.
2. Go to the **Actions** tab.
3. Wait for the workflow to finish.
4. Open the completed workflow.
5. Scroll to **Artifacts**.
6. Download:

```
ledger-debug-apk
```

7. Extract the ZIP file.
8. Install:

```
app-debug.apk
```

on your Android device.

---

# 📦 About This APK

The generated APK is a debug build.

It is:

✅ Safe for personal testing
✅ Installable on Android devices
✅ Suitable for everyday personal use

It is not ready for Google Play Store publishing because Play Store releases require:

* A release signing key
* A properly configured production build
* Additional publishing requirements

---

# 📲 Installing on Android

When installing the APK:

1. Transfer the APK file to your phone.
2. Open the file.
3. Android may ask permission to install unknown apps.
4. Allow permission.
5. Install the application.

---

# 🏗️ Building Locally with Android Studio

If you prefer building the app on your own machine instead of using GitHub Actions, the setup has been simplified.

## Requirements

* Node.js 18 or later
* npm
* Android Studio

## Steps

1. Clone this repository:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd ledger-app
```

2. Install dependencies:

```bash
npm install
```

3. Open the project in Android Studio.

4. Build and run the app on an emulator or a physical Android device.

That's it! The Android project is already configured, so you no longer need to manually run Capacitor setup commands such as:

* `npx cap add android`
* `npx cap sync android`
* `npx cap open android`

Those steps have already been completed for this repository.

---

## Running the Web Version

To run the web version for development:

```bash
npm run dev
```

Open the local URL shown in your terminal (typically `http://localhost:5173`).

---

## Building a Production Web Bundle

To create an optimized production build:

```bash
npm run build
```

This generates the production files in the `dist/` directory.
---
---

# 🏢 Building Manually With Android Studio

If you prefer building locally:

```bash
npm install

npm run build

npx cap add android

npx cap sync android

npx cap open android
```

This opens the native Android project in Android Studio.

From there you can:

* Run the app on an emulator
* Run it on a physical device
* Generate signed APKs

---

# 📂 Project Structure

```
ledger-app/

├── .github/
│   └── workflows/
│       └── build-apk.yml

├── capacitor.config.json

├── index.html

├── package.json

├── vite.config.js

└── src/
    ├── main.jsx
    └── App.jsx
```

---

# 📌 Project Status

🚧 Currently in active development.

The goal is to continuously improve Ledger while learning modern app development practices.

---

# 🗺️ Roadmap

## Version 0.1

* [x] Initial application setup
* [x] React + Vite foundation
* [x] Capacitor integration
* [x] Basic tracking functionality

## Version 0.5

* [ ] Improved UI
* [ ] More tracking features
* [ ] Better analytics

## Version 1.0

* [ ] Stable release
* [ ] Production-ready build
* [ ] Additional customization options

---

# 📝 Changelog

## v0.1

* Initial project creation
* Added React + Vite setup
* Added Capacitor mobile packaging
* Added GitHub Actions APK workflow

---

# 🧠 Lessons Learned

Building Ledger helped me learn:

* React component development
* Mobile app packaging
* Local data storage
* UI/UX design
* Git and GitHub workflows
* Debugging and problem solving
* AI-assisted software development

---

# 🐛 Known Issues

Current known issues:

* Custom app icon still needs implementation
* Some fonts currently load from Google's CDN
* Offline font support may be added in a future update

---

# 📄 License

All Rights Reserved.

This project is currently a personal learning project. The source code may not be copied, redistributed, or used commercially without permission.

---

# 📬 Contact

GitHub:

```
@YOUR_USERNAME
```

---

# ❤️ Why I Built Ledger

Ledger was created as a personal project to explore app development, improve programming skills, and build a practical tool for tracking habits, goals, and personal growth.

The project represents continuous learning, experimentation, and improvement through building real software.
