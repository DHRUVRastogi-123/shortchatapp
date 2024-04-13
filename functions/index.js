const functions = require("firebase-functions");
const Filter = require("bad-words");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const filter = new Filter();

exports.detectEvilUsers = functions.firestore
    .document("messages/{msgId}")
    .onWrite(async (change, ctx) => {
      const {text, uid} = change.after.data();

      if (filter.isProfane(text)) {
        const cleaned = filter.clean(text);
        functions.logger.log(`Profanity detected in message: ${text}`);
        await change.after.ref.update(
            {text: `🤐 I got BANNED for life for saying... ${cleaned}`});
        await db.collection("banned").doc(uid).set({});
      }

      const userRef = db.collection("users").doc(uid);
      const userData = (await userRef.get()).data();

      if (userData.msgCount >= 7) {
        await db.collection("banned").doc(uid).set({});
      } else {
        await userRef.set({msgCount: (
          userData.msgCount || 0) + 1}, {merge: true});
      }
    });
