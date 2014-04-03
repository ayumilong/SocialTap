define(['dojo/_base/declare',
		'dojo-mama/Module',
		'app/datasets/CreateDatasetView',
		'app/datasets/DatasetView'
], function(declare, Module, CreateDatasetView, DatasetView) {
	return declare([Module],{
		'class': 'datasetsModule',

		postCreate: function() {
			this.inherited(arguments);

			var dv = new DatasetView();
			this.registerView(dv);

			var cdv = new CreateDatasetView();
			this.registerView(cdv);
		}
	});
});
