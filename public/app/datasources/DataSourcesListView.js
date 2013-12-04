define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojox/mobile/EdgeToEdgeList',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/LinkListItem',
		'dojo-mama/util/toaster',
		'dojo-mama/views/ModuleScrollableView'
], function(declare, lang, domConstruct, xhr, EdgeToEdgeList, BaseListItem, LinkListItem, toaster, ModuleScrollableView) {
	return declare([ModuleScrollableView], {

		'class': 'datasetsListView',

		dataPromise: null,

		dataUrl: '/api/v0/data_sources.json',

		listsContainer: null,

		route: '/',

		buildRendering: function() {
			this.inherited(arguments);

			this.listsContainer = domConstruct.create('div', {}, this.domNode);

			domConstruct.create('a', {
				href: '#/datasources/create',
				innerHTML: 'Create New Data Source',
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
		},

		activate: function(e) {
			this.inherited(arguments);

			if (this.dataPromise !== null) {
				this.dataPromise.cancel();
			}

			domConstruct.empty(this.listsContainer);
			this.dataPromise = xhr.get('/api/v0/data_sources.json', {
				handleAs: 'json'
			})
				.then(lang.hitch(this, function(sources) {

					var sourceTypes = [
						{type: 'GnipDataSource', label: 'Gnip Rules'},
						{type: 'FileDataSource', label: 'Files'},
					];

					var i, j, list, li, source;
					for (i = 0; i < sourceTypes.length; i++) {

						domConstruct.create('div', {
							'class': 'dmListDivider',
							innerHTML: sourceTypes[i].label
						}, this.listsContainer);

						list = new EdgeToEdgeList();
						list.placeAt(this.listsContainer);
						list.startup();

						if (sources.hasOwnProperty(sourceTypes[i].type)) {
							for (j = 0; j < sources[sourceTypes[i].type].length; j++) {

								source = sources[sourceTypes[i].type][j];

								li = new LinkListItem({
									href: this.module.getRouteHref(this.route) + '/' + source.id
								});

								if (source.type === 'GnipDataSource') {
									li.set('text', source.gnip_data_source_rule.value);
								}
								else if (source.type === 'FileDataSource') {
									li.set('text', source.file_data_source_file.path);
									li.set('rightText', source.file_data_source_file.format);
								}

								list.addChild(li);
								li.startup();
							}
						}

						if (!list.hasChildren()) {
							li = new BaseListItem({
								text: 'None found'
							});
							list.addChild(li);
							li.startup();
						}
					}

					this.dataPromise = null;
				}),
				lang.hitch(this, function(err) {
					console.error(err);
					toaster.displayMessage({
						text: 'Unable to load data',
						type: 'error',
						time: -1
					});
					this.dataPromise = null;
				}));
		}

	});
});
