import {ipcRenderer} from "electron";

global.appRoot = window.appRoot = __dirname


window.electronAPI = {
	setTitle: (title) => ipcRenderer.send('set-title', title),
	getVersion: () => ipcRenderer.sendSync("get-version"),
	quitAndInstall: () => ipcRenderer.send('quit-and-install'),
	onUpdateAvailable: (fn) => ipcRenderer.on("update-available", () => fn()),
	colorMenu: (color, x: number, y: number) => ipcRenderer.invoke('color-menu', color, x, y)
}

Object.freeze(window.electronAPI);

export interface IElectronAPI {
	setTitle: (title: string) => void,
	getVersion: () => string,
	quitAndInstall: () => void,
	onUpdateAvailable: (fn: () => void) => void,
	colorMenu: (color: string, x: number, y: number) => Promise<string|false>
}

declare global {
	interface Window {
		appRoot: string
		electronAPI: IElectronAPI
	}
}
