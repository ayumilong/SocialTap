define(['dojo/_base/declare',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/on',
		'dojo/text!./DatasetSelector.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dojo-mama/util/_XHRMixin'
], function(declare, kernel, lang, domClass, domConstruct, on,
	template, _WidgetBase, _TemplatedMixin, _XHRMixin)
{
	return declare([_WidgetBase, _TemplatedMixin, _XHRMixin], {
		'class': 'stDatasetSelector',

		templateString: template,

		postCreate: function() {
			this.inherited(arguments);
			on(this.toggleListButton, 'click', lang.hitch(this, this.toggleDatasetList));
			on(this.newDatasetLink, 'click', lang.hitch(this, this.closeDatasetList));
			this.loadData('datasets', '/api/v0/datasets');
		},

		handleData: function(key, data) {

			var addClickHandler = lang.hitch(this, function(li, dataset) {
				on(li, 'click', lang.hitch(this, function() {
					this.datasetNameNode.innerHTML = dataset.name;
					this.closeDatasetList();
				}));
			});

			if (key === 'datasets') {
				domConstruct.empty(this.datasetListNode);

				var i, routeDataset;
				var routeRegex, matches;
				for (i = 0; i < kernel.global.config.topNav.length; i++) {
					routeRegex = new RegExp(kernel.global.config.topNav[i].route.replace(':dataset_id', '(\\d+)'));
					matches = window.location.hash.slice(1).match(routeRegex);
					if (matches) {
						routeDataset = parseInt(matches[1], 10);
						break;
					}
				}

				var li;
				for (i = 0; i < data.length; i++) {

					if (data[i].id === routeDataset) {
						this.datasetNameNode.innerHTML = data[i].name;
					}

					li = domConstruct.create('li', {
						innerHTML: '<a href="#/datasets/' + data[i].id + '">' + data[i].name + '</a>'
					}, this.datasetListNode);
					addClickHandler(li, data[i]);
				}
			}
		},

		openDatasetList: function() {
			domClass.remove(this.menuNode, 'hidden');
			this.loadData('datasets', '/api/v0/datasets');
			domClass.replace(this.toggleListButton, 'fa-folder-open-o', 'fa-folder-o');
		},

		closeDatasetList: function() {
			domClass.add(this.menuNode, 'hidden');
			domClass.replace(this.toggleListButton, 'fa-folder-o', 'fa-folder-open-o');
		},

		toggleDatasetList: function() {
			if (domClass.contains(this.menuNode, 'hidden')) {
				this.openDatasetList();
			}
			else {
				this.closeDatasetList();
			}
		}
	});
});
