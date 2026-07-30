# Sod Job Tracker — Standalone PWA

A phone-installable web app for tracking sod install jobs (address, lot #,
rolls/pallets, Google Maps pin, photos) and trucking load drops
(neighborhood + amount, logged in seconds). Backed by a real database
(Firebase), so it works independently of Claude and can be installed on
phones via "Add to Home Screen" — no App Store needed.

## What's in this folder

- `index.html` — the whole app (UI + logic)
- `manifest.json` — tells phones how to install it as an app icon
- `sw.js` — service worker, caches the app shell for fast/offline loading
- `icons/` — app icons (192px and 512px)

## 1. Create a free Firebase project (~5 minutes)

1. Go to <https://console.firebase.google.com> and click **Add project**.
   Name it something like `sod-job-tracker`. You can skip Google Analytics.
2. Once created, click the **web icon (`</>`)** on the project overview
   page to register a web app. Name it anything, skip Firebase Hosting
   setup for now (Claude Code will handle deployment).
3. Firebase will show you a `firebaseConfig` object — copy the whole thing.
4. Open `index.html`, find this block near the top of the `<script>` tag,
   and paste your values in:

   ```js
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

5. In the Firebase console, go to **Build → Firestore Database → Create
   database**. Start in **test mode** for now (see security note below).
6. Go to **Build → Storage → Get started**. Also start in test mode.

## 2. Security rules (important before real use)

Test mode leaves your data open to anyone with the URL for 30 days, then
locks everyone out. For an internal crew tool with no login screen, a
reasonable middle ground is to leave read/write open but set the rules to
not expire, OR add simple Firebase Authentication (e.g. one shared email/
password, or Google sign-in) and require `request.auth != null`. Ask
Claude Code to add basic auth if you want a login step — it's a fairly
small addition.

Minimal "open but intentional" Firestore rule (`Firestore → Rules`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

And Storage (`Storage → Rules`):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

These are fine for a quick internal tool but mean anyone with the URL can
read/write data — ask Claude Code to lock this down with authentication
once you're past testing.

## 3. Deploy

Easiest free option is Firebase Hosting, since it's already part of the
same project:

```
npm install -g firebase-tools
firebase login
firebase init hosting     # choose this folder as the public directory
firebase deploy
```

That gives you a live URL like `https://sod-job-tracker.web.app`. Netlify
or Vercel work too if preferred — just drag-and-drop this folder in.

## 4. Install on phones

Once deployed, open the live URL on a phone:

- **Android/Chrome:** you'll see an "Install" banner in the app itself, or
  use the browser menu → "Install app" / "Add to Home Screen."
- **iPhone/Safari:** tap the Share icon → "Add to Home Screen." (iOS
  doesn't support the automatic install prompt, so the app shows manual
  instructions instead.)

Either way, it lands as a normal-looking app icon and opens full-screen.

## Notes on scaling

- Search is currently client-side (loads all jobs, filters in the
  browser) — fine for hundreds of jobs, but if this grows into the
  thousands, ask Claude Code to switch to server-side Firestore queries.
- Firebase's free "Spark" plan covers this comfortably for a single crew
  (Firestore: 50K reads/20K writes per day free; Storage: 5GB free).
