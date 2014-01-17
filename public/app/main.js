define(['dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/has',
		'dojo/parser',
		'dojo/ready',
		'dojo-mama/ModuleManager',
		'app/dmConfig'
], function (kernel, lang, domClass, has, parser, ready, ModuleManager, dmConfig) {
	ready(function() {

		if (!has('touch')) {
			domClass.add(document.getElementsByTagName('html')[0], 'no_touch');
		}

		kernel.global.config = dmConfig;

		parser.parse().then(function() {
			var mm = new ModuleManager({
				config: lang.mixin(kernel.global.config, {
					moduleContentNode: document.getElementById('moduleContentNode')
				})
			});
			mm.startup();
		});

	});
});
