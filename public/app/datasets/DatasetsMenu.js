define(['dojo/_base/declare',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/_base/window',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/on',
		'dojo/request/xhr',
		'dojo/text!./DatasetsMenu.html',
		'dojo/topic',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin'
], function(declare, kernel, lang, win, domClass, domConstruct, on, xhr, template, topic, _WidgetBase, _TemplatedMixin) {
	return declare([_WidgetBase, _TemplatedMixin], {

		templateString: template,

		_buildVisualizationSubMenu: function(li, dataset) {
			var menu = domConstruct.create('div', {
				'class': 'dropdownMenu visMenu',
			}, li);

			var createClickHandler = lang.hitch(this, function(visTitle) {
				return lang.hitch(this, function() {
					this.hideMenu();
					this.selectedDatasetNode.innerHTML = dataset.name + ': ' + visTitle;
				});
			});

			kernel.global.config.topNav.forEach(lang.hitch(this, function(vis) {
				var li = domConstruct.create('li', {}, menu);

				domConstruct.create('a', {
					href: '#' + vis.route.replace(':dataset_id', dataset.id),
					innerHTML: vis.title,
					onclick: createClickHandler(vis.title)
				}, li);
			}));
		},

		hideMenu: function() {
			domClass.add(this.menuNode, 'hidden');
			domConstruct.destroy(this.overlay);
			this.overlay = null;
		},

		postCreate: function() {
			this.inherited(arguments);

			topic.subscribe('/dojo-mama/routeEvent', lang.hitch(this, function(e) {
				var i;
				var match = false;
				for (i = 0; i < kernel.global.config.topNav.length; i++) {
					var vis = kernel.global.config.topNav[i];
					if (e.newPath.match(new RegExp(vis.route.replace(':dataset_id', '\\d+')))) {
						match = true;
						break;
					}
				}
				if (!match) {
					this.selectedDatasetNode.innerHTML = 'Select a Dataset';
				}
			}));

			this.refresh();
		},

		refresh: function() {
			domClass.add(this.listNode, 'hidden');
			domConstruct.empty(this.listNode);

			var activityIndicator = domConstruct.create('span', {
				'class': 'fa fa-spinner fa-spin',
				style: {
					color: 'white',
					display: 'block',
					'font-size': '40px',
					margin: '30px auto',
					'text-align': 'center'
				}
			}, this.domNode);

			xhr.get('/api/v0/datasets', {
				handleAs: 'json'
			}).then(
				lang.hitch(this, function(datasets) {

					var i, j;
					var route = window.location.hash.slice(1);
					var match = false;
					for (i = 0; i < kernel.global.config.topNav.length; i++) {
						var vis = kernel.global.config.topNav[i];
						if ((match = route.match(new RegExp(vis.route.replace(':dataset_id', '(\\d+)'))))) {
							var datasetId = parseInt(match[1], 10);
							for (j = 0; j < datasets.length; j++) {
								if (datasets[j].id == datasetId) {
									this.selectedDatasetNode.innerHTML = datasets[j].name + ': ' + vis.title;
								}
							}
							break;
						}
					}
					if (!match) {
						this.selectedDatasetNode.innerHTML = 'Select a Dataset';
					}

					var createClickHandler = lang.hitch(this, function(datasetName) {
						return lang.hitch(this, function() {
							this.hideMenu();
							this.selectedDatasetNode.innerHTML = datasetName;
						});
					});

					for (i = 0; i < datasets.length; i++) {
						var li = domConstruct.create('li', {
							innerHTML: '<i class="fa fa-chevron-right"></i>'
						}, this.listNode);

						domConstruct.create('a', {
							href: '#/datasets/' + datasets[i].id,
							innerHTML: datasets[i].name,
							onclick: createClickHandler(datasets[i].name)
						}, li, 'first');

						this._buildVisualizationSubMenu(li, datasets[i]);
					}
					domConstruct.destroy(activityIndicator);
					domClass.remove(this.listNode, 'hidden');
				}),
				lang.hitch(this, function(err) {
					domConstruct.destroy(activityIndicator);
					console.error(err);
				}));
		},

		showMenu: function() {
			domClass.remove(this.menuNode, 'hidden');
			this.overlay = domConstruct.create('div', {
				'class': 'menuOverlay',
			}, win.body());

			on(this.overlay, 'mouseover', lang.hitch(this, this.hideMenu));

			this.refresh();
		}

	});
});
