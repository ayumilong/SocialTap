define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojo/text!./DatasetView.html',
		'dojo-mama/views/_ModuleViewMixin',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/registry',
		'app/datasets/ImportOpListItem'
], function(declare, lang, domAttr, domClass, domConstruct, xhr, template, _ModuleViewMixin, _WidgetBase,
	_TemplatedMixin, registry, ImportOpListItem)
{
	return declare([_WidgetBase, _TemplatedMixin, _ModuleViewMixin], {

		'class': 'datasetView',

		parentView: '/',

		route: '/(\\d+)',

		templateString: template,

		activate: function(e) {
			this.inherited(arguments);
			var datasetId = parseInt(e.params[0]);

			// Load dataset
			domClass.add(this.containerNode, 'hidden');
			var activityIndicator = domConstruct.create('span', {
				'class': 'fa fa-spinner fa-spin',
				style: {
					display: 'block',
					'font-size': '40px',
					margin: '30px auto',
					'text-align': 'center'
				}
			}, this.domNode);
			this.set('dataset', null);
			xhr.get('/api/v0/datasets/' + datasetId, {
				handleAs: 'json'
			}).response.then(lang.hitch(this, function(response) {
				domConstruct.destroy(activityIndicator);
				this.set('dataset', response.data);
			}), lang.hitch(this, function(err) {
				domConstruct.destroy(activityIndicator);
				this.errorNode.innerHTML = 'Unable to load dataset';
				domClass.remove(this.errorNode, 'hidden');
				console.error(err);
			}));
		},

		reset: function() {
			domClass.add(this.containerNode, 'hidden');
			domClass.add(this.errorNode, 'hidden');
			this.errorNode.innerHTML = '';
			this.datasetNameNode.innerHTML = '';
			this.datasetDescriptionNode.innerHTML = '';
			registry.findWidgets(this.importsListNode).forEach(function(w) {
				w.destroy();
			});
		},

		_setDatasetAttr: function(/*Object*/ dataset) {
			if (dataset === null) {
				this.reset();
			}
			else {
				console.log(dataset);
				this.datasetNameNode.innerHTML = dataset.name;
				this.datasetDescriptionNode.innerHTML = dataset.description || 'No description';

				for (var i = 0; i < dataset.import_operations.length; i++) {
					var li = new ImportOpListItem({
						importOp: dataset.import_operations[i]
					});
					li.placeAt(this.importsListNode);
					li.startup();
				}

				domClass.remove(this.containerNode, 'hidden');
			}
		}
	});
});
