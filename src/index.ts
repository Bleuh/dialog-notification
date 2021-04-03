import { app, BrowserWindow, ipcMain, net, Menu, Tray } from "electron";
import { setup as setupPushReceiver } from "electron-push-receiver";
var path = require('path')
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const appName = "Dialog notification";
const appIcon = path.join(__dirname, 'assets/ring-bell.png');
let userID: string = null;
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    title: appName,
    icon: appIcon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  setupPushReceiver(mainWindow.webContents);

  ipcMain.on(
    "api-call",
    (
      even,
      arg: {
        data: any;
        path: string;
      }
    ) => {
      if (userID === null) {
        userID = arg.data.token.substring(0,10);
      }
      const body = JSON.stringify({
        ...arg.data,
        id: userID
      });
      const request = net.request({
        method: "POST",
        protocol: process.env.PROTOCOL,
        hostname: process.env.HOSTNAME,
        path: arg.path,
      });

      request.on("response", (response) => {
        response.on("data", (chunk) => {
          let body = null;
          try {
            body = JSON.parse(chunk.toString())
          } catch (error) {
            body = { result: chunk.toString() }
          }
          even.reply('api-response', {
            statusCode: response.statusCode,
            headers: response.headers,
            body
          })
        });
      });
      request.setHeader("Content-Type", "application/json");
      request.write(body, "utf-8");
      request.end();
    }
  );

  ipcMain.on("show", () => {
    mainWindow.show();
  });

  ipcMain.on("get-setup", (event) => {
    event.reply("setup", {
      mode: process.env.MODE
    })
  })

  let tray: Tray = null;
  const createTray = () => {
    let trayIcon = new Tray(appIcon);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show', click: function () {
                mainWindow.show();
            }
        },
        {
            label: 'Exit', click: () => {
              const request = net.request({
                method: "POST",
                protocol: process.env.PROTOCOL,
                hostname: process.env.HOSTNAME,
                path: '/deleteToken',
              });
              request.setHeader("Content-Type", "application/json");
              request.write(JSON.stringify({
                id: userID
              }), "utf-8");
              request.end();
              app.quit();
            }
        }
    ]);

    trayIcon.on('double-click', () => {
        mainWindow.show();
    });
    trayIcon.setToolTip(appName);
    trayIcon.setContextMenu(contextMenu);
    return trayIcon;
  }

  mainWindow.on('minimize', (event: any) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('restore', () => {
    mainWindow.show();
  });

  mainWindow.on('ready-to-show', () => {
    tray = createTray();
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    const request = net.request({
      method: "POST",
      protocol: process.env.PROTOCOL,
      hostname: process.env.HOSTNAME,
      path: '/deleteToken',
    });
    request.setHeader("Content-Type", "application/json");
    request.write(JSON.stringify({
      id: userID
    }), "utf-8");
    request.end();
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
