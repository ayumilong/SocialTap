define(['dojo/_base/declare',
		'dojo-mama/Module',
		'app/datasets/CreateDatasetView',
		'app/datasets/DatasetsListView',
		'app/datasets/DatasetView',
		'app/datasets/DatasetImportsListView'
], function(declare, Module, CreateDatasetView, DatasetsListView, DatasetView, DatasetImportsListView) {
	return declare([Module],{
		'class': 'datasetsModule',

		postCreate: function() {
			this.inherited(arguments);

			var dlv = new DatasetsListView();
			this.registerView(dlv);
			this.rootView = dlv;

			var dv = new DatasetView();
			this.registerView(dv);

			var cdv = new CreateDatasetView();
			this.registerView(cdv);

			var dilv = new DatasetImportsListView();
			this.registerView(dilv);
		}
	});
});
