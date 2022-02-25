module.exports = {
	pluginOptions: {
		electronBuilder: {
			preload: 'src/preload.ts',
			nodeIntegration: true,
			publish: ['github']
		}
	}
};
