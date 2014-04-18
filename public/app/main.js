define(['dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/has',
		'dojo/parser',
		'dojo/ready',
		'dojo-mama/ModuleManager',
		'app/dmConfig',
		'app/auth/user',
		'app/util/extensions'
], function (kernel, lang, domClass, has, parser, ready, ModuleManager, dmConfig, user) {
	ready(function() {

		if (!has('touch')) {
			domClass.add(document.getElementsByTagName('html')[0], 'no_touch');
		}

		kernel.global.config = dmConfig;

		parser.parse().then(function() {
			user.update().then(function() {
				var mm = new ModuleManager({
					/*beforeRoute: function(e) {
						if (e.newPath !== '/' && e.params.module !== 'auth' && !user.isLoggedIn()) {
							window.location.hash = '/auth/login';
							return false;
						}
						return true;
					},*/
					config: lang.mixin(kernel.global.config, {
						moduleContentNode: document.getElementById('moduleContentNode')
					})
				});
				mm.startup();
			});
		});

	});
});
