import { app, BrowserWindow, ipcMain, net } from "electron";
import { setup as setupPushReceiver } from "electron-push-receiver";
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

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
      const body = JSON.stringify({
        ...arg.data,
      });
      const request = net.request({
        method: "POST",
        protocol: "http:",
        hostname: "127.0.0.1",
        port: 5001,
        path: arg.path,
      });

      request.on("response", (response) => {
        console.log(`STATUS: ${response.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(response.headers)}`);

        response.on("data", (chunk) => {
          console.log(`BODY: ${chunk}`);
        });
      });
      request.on("finish", () => {
        console.log("Request is Finished");
      });
      request.on("abort", () => {
        console.log("Request is Aborted");
      });
      request.on("error", (error) => {
        console.log(`ERROR: ${JSON.stringify(error)}`);
      });
      request.on("close", () => {
        console.log("Last Transaction has occured");
      });

      request.setHeader("Content-Type", "application/json");
      request.write(body, "utf-8");
      request.end();
    }
  );

  ipcMain.on("show", () => {
    mainWindow.show();
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
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
