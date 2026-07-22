# Ledger

A habit, goal, and life-tracking app. This is a standalone React + Vite project —
no Claude-specific APIs involved. Data is saved with `localStorage`, which works
the same in a normal browser and inside the WebView that Capacitor uses to build
Android/iOS apps.

## 🤖 AI Disclosure

This application was developed by me using AI-assisted development tools. I designed the app, defined its features, tested its functionality, and guided the development process, while AI assisted with generating code, debugging, refactoring, and implementation details.

This project reflects my ideas, decisions, and ongoing development rather than being a fully AI-generated application.

## Fastest way to get an installable APK (no local Android setup needed)

This project includes a GitHub Actions workflow
(`.github/workflows/build-apk.yml`) that builds a real, installable debug APK
automatically on GitHub's own servers — you don't need Android Studio, a JDK,
or the Android SDK on your own machine at all.

1. Create a new repository on [github.com](https://github.com/new) (public or
   private, either works).
2. Push this project to it:
   ```bash
   cd ledger-app
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. On GitHub, open your repo's **Actions** tab. A workflow run should already
   be in progress (triggered by the push). If you ever want to rebuild without
   pushing new code, click **Run workflow** there manually.
4. When the run finishes (usually 3–6 minutes), click into it and scroll to
   **Artifacts** at the bottom — download `ledger-debug-apk`. Unzip it to get
   `app-debug.apk`.
5. Transfer that `.apk` to your Android phone (email it to yourself, Google
   Drive, USB, whatever's easiest) and open it. You'll need to allow
   **"Install unknown apps"** for whichever app you used to open it — Android
   will prompt you for this the first time.

That's it — no local build tools required. Every time you push a change to
`main`, a fresh APK is built automatically and shows up in that same Actions
tab.

### About this APK

- It's a **debug build**, signed with Android's auto-generated debug key. This
  is completely fine for installing on your own phone and everyday use — it's
  the same kind of build you'd get testing an app in Android Studio. It is
  **not** suitable for publishing to the Google Play Store, which requires a
  proper release signing key (a separate step, only needed if you want to
  publish it).
- The app icon is currently Capacitor's default placeholder icon. Swapping in
  a custom one is a small follow-up (drop icon files into
  `android/app/src/main/res/` in the generated project, or ask me to add an
  icon-generation step to the workflow).
- Fonts (Aldrich/Inter/JetBrains Mono) load from Google's CDN on first run, so
  the app needs internet the very first time each font is used. Let me know if
  you'd rather have them bundled for full offline use.

## Running it locally (optional, for testing changes before pushing)

You need [Node.js](https://nodejs.org) installed (18+ recommended).

```bash
cd ledger-app
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`).

## Building it yourself with Android Studio (alternative to GitHub Actions)

If you'd rather build locally instead of using GitHub Actions:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

This opens the native project in Android Studio, where you can run it on an
emulator/device, or use **Build > Generate Signed Bundle / APK** for a release
build.

## Project structure

```
ledger-app/
  .github/workflows/build-apk.yml   builds the APK on GitHub's servers
  capacitor.config.json             app id, name, native config
  index.html                        entry HTML
  package.json
  vite.config.js
  src/
    main.jsx        mounts the app
    App.jsx          the entire app (all components, all logic)
```
