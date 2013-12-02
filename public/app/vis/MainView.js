define(['dojo/_base/declare',
		'dojo/dom-construct',
		'dojox/mobile/EdgeToEdgeList',
		'dojo-mama/util/LinkListItem',
		'dojo-mama/views/ModuleScrollableView'
], function(declare, domConstruct, EdgeToEdgeList, LinkListItem, ModuleScrollableView) {
	return declare([ModuleScrollableView], {
		'class': 'visMainView',

		route: '/',

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('div', {
				'class': 'separator',
				innerHTML: 'Visualization Types'
			}, this.domNode);

			var sectionsList = new EdgeToEdgeList();
			sectionsList.placeAt(this.domNode);
			sectionsList.startup();

			var sections = [
				{
					url: 'map',
					title: 'World Map'
				},
				{
					url: 'hashtags',
					title: 'Hashtag Map'
				},
				{
					url: 'mentions',
					title: 'User Mentions'
				},
				{
					url: 'sentiment',
					title: 'Sentiment'

				},
				{
					url: 'test',
					title: 'Test List View'
				}
			];

			var i, section, li;
			var hrefRoot = this.module.getRouteHref(this.route) + '/';
			for (i = 0; i < sections.length; i++) {
				section = sections[i];

				li = new LinkListItem({
					text: section.title
				});
				if (section.url.match(/^http/)) {
					li.set('href', section.url);
					li.set('hrefTarget', '_blank');
				}
				else {
					li.set('href', hrefRoot + section.url);
				}

				sectionsList.addChild(li);
				li.startup();
			}
		}
	});
});
