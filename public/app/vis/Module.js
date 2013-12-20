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

			console.log("root");
			
			var mapView = new MapView();
			this.registerView(mapView);

			console.log("map");
			
			var hashtagMapView = new HashtagMapView();
			this.registerView(hashtagMapView);

			console.log("hashtags");
			
			var sentView = new SentView();
			this.registerView(sentView);

			console.log("sentiment");
			
			var testListView = new TestListView();
			this.registerView(testListView);

			console.log("testlist");
			
		}

	});
});
