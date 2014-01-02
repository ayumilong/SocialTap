define(['dojo/_base/declare',
		'dojo-mama/Module',
		'./VisBaseView',
		'../visConfig'
], function(declare, Module, VisBaseView, visConfig) {
	return declare([Module], {
		'class': 'visModule',

		postCreate: function() {
			this.inherited(arguments);

			var i, vis, view;
			for (i = 0; i < visConfig.visualizations.length; i++) {
				vis = visConfig.visualizations[i];
				console.warn(vis);
				view = new VisBaseView({
					parentView: '/',
					route: vis.route.replace(/^\/vis/, ''),
					title: vis.title,
					visModuleId: vis.id,
					visOptions: vis.options
				});
				this.registerView(view);
			}

		}

	});
});
