define(['dojo/_base/declare',
		'dojo-mama/Module',
		'app/datasources/CreateDataSourceView',
		'app/datasources/DataSourcesListView'
], function(declare, Module, CreateDataSourceView, DataSourcesListView) {
	return declare([Module],{
		'class': 'dataSourcesModule',

		postCreate: function() {
			this.inherited(arguments);

			var dlv = new DataSourcesListView();
			this.registerView(dlv);
			this.rootView = dlv;

			var cdv = new CreateDataSourceView();
			this.registerView(cdv);
		}
	});
});
