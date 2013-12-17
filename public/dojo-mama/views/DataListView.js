define(['dojo/_base/declare',
		'dojo-mama/util/DataListPane',
		'dojo-mama/views/BaseView',
], function(declare, DataListPane, BaseView) {
	return declare([BaseView, DataListPane], {

		dataUrlFromRoute: function(routeParams) {
			return this.dataUrl;
		},

		activate: function(e) {
			this.inherited(arguments);
			this.set('dataUrl', this.dataUrlFromRoute(e.params));
		}

	});
});
