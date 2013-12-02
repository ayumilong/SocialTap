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

		gnipSourceList: null,

		fileSourceList: null,

		route: '/',

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('div', {
				'class': 'dmListDivider',
				innerHTML: 'Gnip Sources'
			}, this.domNode);

			this.gnipSourceList = new EdgeToEdgeList();
			this.gnipSourceList.placeAt(this.domNode);
			this.gnipSourceList.startup();

			domConstruct.create('div', {
				'class': 'dmListDivider',
				innerHTML: 'File Sources'
			}, this.domNode);

			this.fileSourceList = new EdgeToEdgeList();
			this.fileSourceList.placeAt(this.domNode);
			this.fileSourceList.startup();

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

			this.gnipSourceList.destroyDescendants();
			this.fileSourceList.destroyDescendants();
			this.dataPromise = xhr.get('/api/v0/data_sources.json', {
				handleAs: 'json'
			})
				.then(lang.hitch(this, function(sources) {

					var i, li, source;
					for (i = 0; i < sources.length; i++) {

						source = sources[i];

						li = new LinkListItem({
							href: this.module.getRouteHref(this.route) + '/' + source.id
						});

						if (source.type === 'GnipDataSource') {
							li.set('text', source.gnip_data_source_rule.value);
							this.gnipSourceList.addChild(li);
						}
						else if (source.type === 'FileDataSource') {
							li.set('text', source.file_data_source_file.path);
							li.set('rightText', source.file_data_source_file.format);
							this.fileSourceList.addChild(li);
						}

						li.startup();
					}

					if (!this.gnipSourceList.hasChildren()) {
						li = new BaseListItem({
							text: 'No Gnip sources found'
						});
						this.gnipSourceList.addChild(li);
						li.startup();
					}
					if (!this.fileSourceList.hasChildren()) {
						li = new BaseListItem({
							text: 'No file sources found'
						});
						this.fileSourceList.addChild(li);
						li.startup();
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
