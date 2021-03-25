import "./index.css";

let { ipcRenderer } = window.Electron;
const {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} = require('electron-push-receiver/src/constants')

document.getElementById('sender-button').addEventListener('click', event => {
  event.preventDefault();
  document.getElementById('selector').style.display = "none";
  document.getElementById('sender').style.display = "block";
});
document.getElementById('receiver-button').addEventListener('click', event => {
  event.preventDefault();
  document.getElementById('selector').style.display = "none";
  document.getElementById('receiver').style.display = "block";
});

document.getElementById('answer').addEventListener('submit', event => {
  event.preventDefault();
  ipcRenderer.send("api-call", {
    data: {
      "title": (<HTMLInputElement>document.getElementById('answer-title')).value,
      "body": (<HTMLInputElement>document.getElementById('answer-message')).value
    },
    path: '/notifyAll'
  })
});

document.getElementById('call-button').addEventListener('click', event => {
  event.preventDefault();
  const element = document.getElementById('call-button');
  element.classList.add("waiting");
  ipcRenderer.send("api-call", {
    data: {
      "title": "Maman",
      "body": "À table ! Il est l'heure de manger !",
      "imageUrl": "https://i.pinimg.com/originals/81/8c/9f/818c9fc5fd517fc270f0294dbd53edf5.jpg"
    },
    path: '/notifyAll'
  })
});

ipcRenderer.on('api-response', (_, response) => {
  console.log('Response', response)
})

// Listen for service successfully started
ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_, token) => {
  ipcRenderer.on("api-call", () => {
    console.log('call done');
  })
  ipcRenderer.send("api-call", {
    data: {
      token
    },
    path: '/addToken'
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
    path: '/addToken'
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
    document.getElementById('sender-title').innerText = title;
    document.getElementById('sender-text').innerText = body;
    document.getElementById('receiver-title').innerText = title;
    document.getElementById('receiver-text').innerText = body;
    const element = document.getElementById('call-button');
    element.classList.remove("waiting");
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