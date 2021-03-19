import "./index.css";

let { ipcRenderer } = window.Electron;
const {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} = require('electron-push-receiver/src/constants')

document.getElementById('answer').addEventListener('submit', event => {
  event.preventDefault();
  ipcRenderer.send("api-call", {
    data: {
      "title": (<HTMLInputElement>document.getElementById('answer-title')).value,
      "body": (<HTMLInputElement>document.getElementById('answer-message')).value,
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/250px-Image_created_with_a_mobile_phone.png"
    },
    path: '/dialog-notification/us-central1/notifyAll'
  })
});

// Listen for service successfully started
ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
  ipcRenderer.on("api-call", () => {
    console.log('call done');
  })
  ipcRenderer.send("api-call", {
    data: {
      token
    },
    path: '/dialog-notification/us-central1/addToken'
  })
  console.log('service successfully started', token)
})

// Handle notification errors
ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_, error) => {
  console.log('notification error', error)
})

// Send FCM token to backend
ipcRenderer.on(TOKEN_UPDATED, (_, token) => {
  ipcRenderer.on("api-call", () => {
    console.log('call done');
  })
  ipcRenderer.send("api-call", {
    data: {
      token
    },
    path: '/dialog-notification/us-central1/addToken'
  })
  console.log('token updated', token)
})

// Display notification
ipcRenderer.on(NOTIFICATION_RECEIVED, (_, serverNotificationPayload) => {
  // check to see if payload contains a body string, if it doesn't consider it a silent push
  if (serverNotificationPayload.notification) {
    // payload has a body, so show it to the user
    console.log('display notification', serverNotificationPayload)
    const { title, body, image } = serverNotificationPayload.notification;
    document.getElementById('title').innerText = title;
    document.getElementById('message').innerText = body;
    let myNotification = new Notification(title, {
      body,
      icon: image
    })

    myNotification.onclick = () => {
      ipcRenderer.send("show");
      console.log('Notification clicked')
    }
  } else {
    // payload has no body, so consider it silent (and just consider the data portion)
    console.log('do something with the key/value pairs in the data', serverNotificationPayload.data)
  }
})

// Start service replace with FCM sender ID from FCM web admin under Settings->Cloud Messaging
console.log('starting service and registering a client')
ipcRenderer.send(START_NOTIFICATION_SERVICE, process.env.SENDER_ID)