define(['dojo/_base/declare',
		'dojo/dom-construct',
		'dojo-mama/util/LinkListItem',
		'app/util/XHRListView'
], function(declare, domConstruct, LinkListItem, XHRListView) {
	return declare([XHRListView], {

		'class': 'datasetsListView',

		dataUrl: '/api/v0/datasets.json',

		noResultsMessage: 'No datasets found',

		route: '/',

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('a', {
				href: '#/datasets/create',
				innerHTML: 'Create New Dataset',
				style: {margin: '10px'}
			}, this.domNode);
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
