# Memorease

Memorease is designed specifically to assist individuals with Alzheimer’s and Dementia by providing an easy way to track their lives. Using Text-to-Speech and Speech-to-Text features, users can maintain a journal of their life. This journal is easily accessible through the advanced Gemini API, making it simple to find specific entries, by a very natural method of chatting. Moreover, users can store images of special places, offering a way to revisit important memories. Our app also includes location features to help ensure safety, while caretakers can utilise Memorease to improve tracking and treatment for their patients.

## Build Instructions

To run the APK directly, download the given release on the Github Repository itself.

To build yourself:

Prerequisites:
Node.js, Expo, API keys for Firebase, Gemini, Google Maps.

```bash
npm install
```

After setting up Firebase for Realtime Database, Storage and Authentication, copy the Firebase Config and paste in config.js.

Also, in Expo, create an Expo EAS Project and set the projectId as your own.
Eg.:

```
extra: {
      eas: {
        projectId: "79a33e02-ba0d-4622-9cbb-835575549553",
      },
},
```

After setting up all this, run:

```bash
eas build --profile development --platform android
```

Let the Expo build happen, and after its completion, download the APK and run on your local Android machine.
