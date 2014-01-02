define(['dojo/_base/declare',
		'dojo-mama/Module',
		'./VisBaseView',
		'app/vis/sentView'
], function(declare, Module, VisBaseView, SentView) {
	return declare([Module], {
		'class': 'visModule',

		postCreate: function() {
			this.inherited(arguments);

			var browseView = new VisBaseView({
				parentView: '/',
				route: '/browse/:dataset_id',
				title: 'Browse',
				visModuleId: 'app/vis/Browse'
			});
			this.registerView(browseView);

			var mapView = new VisBaseView({
				parentView: '/',
				route: '/map/:dataset_id',
				title: 'World Map',
				visModuleId: 'app/vis/Map'
			});
			this.registerView(mapView);

			var hashtagMapView = new VisBaseView({
				parentView: '/',
				route: '/hashtags/:dataset_id',
				title: 'Hashtag Cloud',
				visModuleId: 'app/vis/WordCloud'
			});
			this.registerView(hashtagMapView);

			var sentView = new SentView();
			this.registerView(sentView);

		}

	});
});
