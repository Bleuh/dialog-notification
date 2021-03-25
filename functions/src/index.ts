import * as functions from "firebase-functions";
import admin = require("firebase-admin");
import { Token } from "./types";
admin.initializeApp();

exports.addToken = functions.https.onRequest(async (req, res) => {
  if (!req.body.id) {
    res.status(400).send("Missing properties in body : [ id ]");
    return;
  }
  if (!req.body.token) {
    res.status(400).send("Missing properties in body : [ token ]");
    return;
  }
  const token: Token = {
    value: req.body.token as string,
    updatedAt: admin.firestore.Timestamp.now().toDate(),
  };
  const document = admin.firestore().collection("tokens").doc(req.body.id);
  await document.set(token);
  res.json({ result: `Token with ID: ${req.body.id} added.` });
});

exports.deleteToken = functions.https.onRequest(async (req, res) => {
  if (!req.body.id) {
    res.status(400).send("Missing properties in body : [ id ]");
    return;
  }
  await admin.firestore().collection("tokens").doc(req.body.id).delete();
  res.json({ result: `Token with ID: ${req.body.id} deleted.` });
});

exports.notifyAll = functions.https.onRequest(async (req, res) => {
  if (!req.body.id) {
    res.status(400).send("Missing properties in body : [ id ]");
    return;
  }
  if (!req.body.title) {
    res.status(400).send("Missing properties in body : [ title ]");
    return;
  }
  const documents = (await admin.firestore().collection("tokens").get()).docs.filter(
    (doc) => doc.id !== req.body.id
  );
  if (documents.length === 0) {
    res.status(404).send("Nothing to notify");
    return;
  }
  const tokens = documents.map((e) => e.data().value);
  const notification: { [key: string]: any } = {
    title: req.body.title,
  };
  const data: { [key: string]: any } = {
    title: req.body.title,
  };
  if (req.body.body) {
    notification.body = req.body.body;
    data.body = req.body.body;
  }
  if (req.body.imageUrl) {
    notification.imageUrl = req.body.imageUrl;
    data.imageUrl = req.body.imageUrl;
  }
  if (req.body.info) {
    data.info = req.body.info;
  }

  const message: admin.messaging.MulticastMessage = {
    notification,
    data,
    tokens,
  };
  const response = await admin.messaging().sendMulticast(message);
  res.json({ result: `${response.successCount} messages were sent successfully` });
});
