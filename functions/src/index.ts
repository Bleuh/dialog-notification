import * as functions from "firebase-functions";
import admin = require("firebase-admin");
import { Token } from "./types";
admin.initializeApp();

exports.addToken = functions.https.onRequest(async (req, res) => {
  if (!req.body.token) {
    res.status(400).send("Missing properties in body : [ token ]");
    return;
  }
  const token: Token = {
    value: req.body.token as string,
    updatedAt: admin.firestore.Timestamp.now().toDate(),
  };
  const writeResult = await admin.firestore().collection("tokens").add(token);
  res.json({ result: `Token with ID: ${writeResult.id} added.` });
});

exports.deleteToken = functions.https.onRequest(async (req, res) => {
  if (!req.body.token) {
    res.status(400).send("Missing properties in body : [ token ]");
    return;
  }
  await admin.firestore().collection("tokens").doc(req.body.token).delete();
  res.json({ result: `Token with ID: ${req.body.token} deleted.` });
});

exports.notifyAll = functions.https.onRequest(async (req, res) => {
  if (!req.body.title) {
    res.status(400).send("Missing properties in body : [ title ]");
    return;
  }
  const tokens = (await admin.firestore().collection("tokens").get()).docs.map((e) =>
    e.data().value
  );
  if (tokens.length === 0) {
    res.status(404).send("Nothing to notify");
    return;
  }
  const message: admin.messaging.MulticastMessage = {
    notification: {
      title: req.body.title,
      body: req.body.body || "",
      imageUrl: req.body.imageUrl || ""
    },
    data: {
      title: req.body.title,
      body: req.body.body || "",
      imageUrl: req.body.imageUrl || "",
      info: req.body.info || "",
    },
    tokens: tokens,
  };
  const response = await admin.messaging().sendMulticast(message);
  res.json({ result: `${response.successCount} messages were sent successfully` });
});
