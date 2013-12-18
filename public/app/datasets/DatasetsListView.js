define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo-mama/util/DataListPane',
		'dojo-mama/util/LinkListItem',
		'dojo-mama/views/ModuleView',
		'dojo-mama/views/DataListView'
], function(declare, lang, domConstruct, DataListPane, LinkListItem, ModuleView, DataListView) {
	return declare([DataListView], {

		'class': 'datasetsListView',

		dataUrl: '/api/v0/datasets.json',

		noResultsMessage: 'No datasets found',

		route: '/',

		showFooter: true,

		title: 'Available Datasets',

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('a', {
				innerHTML: 'Create New Dataset',
				href: '#/datasets/create'
			}, this.footerNode);
		},

		buildListItem: function(obj) {
			var hrefRoot = this.module.getRouteHref(this.route) + '/';
			var li = new LinkListItem({
				href: hrefRoot + obj.id,
				text: obj.name
			});
			return li;
		}

	});
});
