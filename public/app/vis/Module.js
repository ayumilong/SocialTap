define(['dojo/_base/declare',
		'dojo-mama/Module',
		'app/vis/HashtagMapView',
		'app/vis/MainView',
		'app/vis/MapView',
		'app/vis/sentView',
		'app/vis/TestListView'
], function(declare, Module, HashtagMapView, MainView, MapView, SentView, TestListView) {
	return declare([Module], {
		'class': 'visModule',

		postCreate: function() {
			this.inherited(arguments);

			this.rootView = new MainView({
				module: this
			});

			this.registerView(this.rootView);

			var mapView = new MapView();
			this.registerView(mapView);

			var hashtagMapView = new HashtagMapView();
			this.registerView(hashtagMapView);

			var sentView = new SentView();
			this.registerView(sentView);

			var testListView = new TestListView();
			this.registerView(testListView);

		}

	});
});
