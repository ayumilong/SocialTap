/**
 * This file is the application's main JavaScript file. It is listed as a dependency in run.js and will automatically
 * load when run.js loads.
 *
 * Because this file has the special filename `main.js`, and because we've registered the `app` package in run.js,
 * whatever object this module returns can be loaded by other files simply by requiring `app` (instead of `app/main`).
 *
 */
define(['require'], function (require) {
	require([
		'dojo-mama/layout/responsiveTwoColumn/Layout',
		'app/dmConfig',
		'app/util/dom-utils',
		'dojo/_base/window',
		'dojo/dom-class',
		'dojo/has',
		'dojo/ready',
		'app/util/ProgressIndicator'
	], function (Layout, dmConfig, domUtils, win, domClass, has, ready, ProgressIndicator) {
		ready(function() {

			if (!has('touch')) {
				domClass.add(document.getElementsByTagName('html')[0], 'no_touch');
			}

			var layout = new Layout({config: dmConfig});
			layout.placeAt(win.body(), 'first');
			var layoutReady = layout.startup();

			layoutReady.then(function() {
				// render cufon fonts for Winblows Mobile
				domUtils.cufonify();
				domUtils.injectNavSpinners(layout);
			});
		});
	});
});
