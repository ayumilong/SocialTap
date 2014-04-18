define(['dojo/_base/declare',
		'dojo-mama/Module',
		'app/datasets/CreateDatasetView',
		'app/datasets/DatasetView',
		'app/datasets/StartImportView'
], function(declare, Module, CreateDatasetView, DatasetView, StartImportView) {
	return declare([Module],{
		'class': 'datasetsModule',

		postCreate: function() {
			this.inherited(arguments);

			var dv = new DatasetView();
			this.registerView(dv);

			var cdv = new CreateDatasetView();
			this.registerView(cdv);

			var siv = new StartImportView();
			this.registerView(siv);
		}
	});
});
