'use strict'

import {app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions, protocol, dialog} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS3_DEVTOOLS} from 'electron-devtools-installer'
import {autoUpdater} from "electron-updater"
import * as path from "path";

//import {initialize} from "@electron/remote/main";

//initialize();

const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
	{scheme: 'app', privileges: {secure: true, standard: true}}
])

async function createWindow() {
	// Create the browser window.
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			nodeIntegration: true,
			contextIsolation: false
		}
	})

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
		if (!process.env.IS_TEST) win.webContents.openDevTools()
	} else {
		createProtocol('app')
		// Load the index.html when not in development
		await win.loadURL('app://./index.html#');
		autoUpdater.autoDownload = true;
		autoUpdater.autoInstallOnAppQuit = true;
		await checkUpdate();
	}
	
	return win;
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS3_DEVTOOLS)
		} catch (e) {
			console.error('Vue Devtools failed to install:', e.toString())
		}
	}
	
	/////// API
	
	ipcMain.on('set-title', handleSetTitle);
	ipcMain.on('get-version', (event) => event.returnValue = app.getVersion());
	ipcMain.on('quit-and-install', () => autoUpdater.quitAndInstall(false, true));
	ipcMain.handle('color-menu', (event, color, x, y) => new Promise(resolve => Menu.buildFromTemplate(ColorMenu(color, (v) => resolve(v))).popup({x, y, callback: () => resolve(false)})));
	
	///////
	
	const mainWindow = await createWindow();

	autoUpdater.on("update-available", () => mainWindow.webContents.send("update-available"));
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
	if (process.platform === 'win32') {
		process.on('message', (data) => {
			if (data === 'graceful-exit') {
				app.quit()
			}
		})
	} else {
		process.on('SIGTERM', () => {
			app.quit()
		})
	}
}

async function checkUpdate() {
	const result = await autoUpdater.checkForUpdatesAndNotify();
	setTimeout(checkUpdate, 1000 * 30);
}

function handleSetTitle(event, title) {
	const webContents = event.sender
	const win = BrowserWindow.fromWebContents(webContents)
	win.setTitle(title)
}

const ColorMenu = (color: string, fn: (color: string) => void): MenuItemConstructorOptions[] => {
	
	function colorsFor(): MenuItemConstructorOptions[] {
		return [
			{label: "Rouge", click: () => fn("red"), type: "checkbox", checked: color === "red"},
			{label: "Jaune", click: () => fn("yellow"), type: "checkbox", checked: color === "yellow"},
			{label: "Vert", click: () => fn("green"), type: "checkbox", checked: color === "green"},
			{label: "Bleu", click: () => fn("blue"), type: "checkbox", checked: color === "blue"},
			{label: "Violet", click: () => fn("violet"), type: "checkbox", checked: color === "violet"},
			{label: "Gris", click: () => fn("grey"), type: "checkbox", checked: color === "grey"},
			{label: "Clear", click: () => fn(undefined), type: "checkbox", checked: color === "" || color === undefined}
		]
	}
	
	return colorsFor();
}
