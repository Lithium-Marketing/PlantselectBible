module.exports = {
	pluginOptions:{
		electronBuilder:{
			//preload: 'src/preload.js',
			nodeIntegration:true,
			publish: ['github']
		}
	}
};
