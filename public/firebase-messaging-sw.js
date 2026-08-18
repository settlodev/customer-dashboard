/* Firebase Cloud Messaging service worker — handles background (tab closed/unfocused) messages. */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Public Firebase web config — fill with the settlo-v3 web app values
// (identical to the NEXT_PUBLIC_FIREBASE_* env vars; public by design, safe to commit).
firebase.initializeApp({
  apiKey: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "settlo-v3",
  messagingSenderId: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || "Settlo";
  const body = (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || "";
  self.registration.showNotification(title, {
    body: body,
    icon: "/web-app-manifest-192x192.png",
    data: payload.data || {},
  });
});
