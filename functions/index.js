// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
/*exports.addMessage = functions.https.onRequest(async (req, res) => {
    // Grab the text parameter.
    const original = req.query.text;
    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    const snapshot = await admin.database().ref('/messages').push({original: original});
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    res.redirect(303, snapshot.ref.toString());
  });*/


  // Listens for new messages added to /provincesStat/lastUpdate and creates an
// onwriter make push notification to all subcripbers
exports.lastUpdateNotificationf2 = functions.database.ref('/provincesStat/lastUpdate')
.onWrite(async (change) => {
  
  // If if last updadate is empty will exit
  if (!change.after.val()) {
    return console.log('Not update ');
  }

  // Get the list of device notification tokens.
  admin.database()
  .ref('notificationTokens/').on('value', async tokensSnapshot => {

  // The array containing all the user's tokens.
  let tokens = tokensSnapshot.val();
  // Check if there are any device tokens.
  if (tokens.length > 0) {
    return console.log('There are no notification tokens to send to.');
  }
  console.log('There are', tokens.length, 'tokens to send notifications to.');
  console.log('tokens', tokens);

  // Notification details.
  const payload = {
    notification: {
      title: '¡Ya actualizamos!',
      body: `¡Entra ya! Informate del estado actual del corona virus en República Dominicana.`
    }
  };

  const tokenKeys = Object.keys(tokens);
  const tokenList = tokenKeys.map( (key) => tokens[key].token);
  console.log('tokenList', tokenList);
  const response = await admin
  .messaging()
  .sendToDevice(tokenList, payload);
  // For each message check if there was an error.
  const tokensToRemove = [];
  response.results.forEach((result, index) => {
    const error = result.error;
    if (error) {
      console.error('Failure sending notification to', tokenList[index], error);
      // Cleanup the tokens who are not registered anymore.
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        tokensToRemove.push(tokensSnapshot.ref.child(tokenKeys[index]).remove());
      }
    }
  });
  return Promise.all(tokensToRemove);
  });

  
});