define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/on',
		'dojox/mobile/Pane',
		'dojo-mama/util/ScrollablePane',
		'dojo-mama/views/ModuleView',
		'./InquiryForm',
		'./OptionsPane'
], function(declare, lang, domConstruct, on, Pane, ScrollablePane, ModuleView, InquiryForm, OptionsPane) {

	return declare([ModuleView], {

		'class': 'visView',

		// datasetId: Integer
		//     ID of dataset being visualized.
		datasetId: null,

		// elasticsearchQuery: Object
		//     Elasticsearch query with filter built from inquiry.
		elasticsearchQuery: null,

		// vis: Object
		//     The visualization for this view.
		vis: null,

		// visDetailsPane: Object
		//     Pane for the visualization to display extra information.
		visDetailsPane: null,

		// visModuleId: String
		//     The AMD module ID for the visualization to load for this view.
		visModuleId: null,

		visOptionsPane: null,

		activate: function(e) {
			// summary:
			//     Get dataset ID from route and activate visualization.
			this.inherited(arguments);
			this.set('datasetId', e.params.dataset_id);
			if (this.vis) {
				this.vis.set('active', true);
			}
		},

		buildRendering: function() {
			this.inherited(arguments);

			var rightPane = new ScrollablePane({
				'class': 'visRightPane'
			});
			rightPane.placeAt(this.domNode);

			domConstruct.create('div', {
				'class': 'dmListDivider',
				innerHTML: 'Inquiry'
			}, rightPane.domNode);

			var inquiryForm = new InquiryForm();
			inquiryForm.placeAt(rightPane.domNode);
			on(inquiryForm, 'submit', lang.hitch(this, function(query) {
				this.set('elasticsearchQuery', query);
			}));

			domConstruct.create('div', {
				'class': 'dmListDivider',
				innerHTML: 'Options'
			}, rightPane.domNode);

			this.visOptionsPane = new OptionsPane();
			this.visOptionsPane.placeAt(rightPane.domNode);
			on(this.visOptionsPane, 'optionSet', lang.hitch(this, function(opt) {
				console.log('option set');
				console.log(opt.name + ' = ' + opt.value);
				if (this.vis) {
					this.vis.set(opt.name, opt.value);
					this.vis.reload();
				}
			}));

			domConstruct.create('div', {
				'class': 'dmListDivider',
				innerHTML: 'Details'
			}, rightPane.domNode);

			this.visDetailsPane = new Pane({
				'class': 'visDetailsPane'
			});
			this.visDetailsPane.placeAt(rightPane.domNode);

		},

		deactivate: function() {
			// summary:
			//     Deactivate visualization.
			this.inherited(arguments);
			if (this.vis) {
				this.vis.set('active', false);
			}
		},

		_setDatasetIdAttr: function(/*Integer*/datasetId) {
			// summary:
			//     Propagate datasetId through to visualization if it exists.
			this._set('datasetId', datasetId);
			if (this.vis) {
				this.vis.set('datasetId', datasetId);
				if (datasetId) {
					this.vis.reload();
				}
			}
		},

		_setElasticsearchQueryAttr: function(/*Object*/query) {
			// summary:
			//     Propagate elasticsearchQuery through to visualization if it exists.
			this._set('elasticsearchQuery', query);

			if (this.vis) {
				this.vis.set('elasticsearchQuery', query);
				this.vis.reload();
			}
		},

		_setVisModuleIdAttr: function(/*String*/visModuleId) {
			this._set('visModuleId', visModuleId);

			// Remove the old visualization if there is one.
			if (this.vis) {
				this.vis.destroy();
				this.vis = null;
			}

			// Load the requested module,
			require([visModuleId], lang.hitch(this, function(VisModule) {
				if (this.visOptionsChangedHandle) {
					this.visOptionsChangedHandle.remove();
				}
				this.vis = new VisModule({
					active: this.active,
					detailsPane: this.detailsPane
				});
				this.vis.placeAt(this.domNode, 'last');

				this.visOptionsPane.set('options', this.vis.get('options'));
				this.visOptionsChangedHandle = on(this.vis, 'optionsChanged', lang.hitch(this, function(newOptions) {
					this.visOptionsPane.set('options', newOptions);
				}));

				// Set visualization's dataset ID and ES query and load data.
				this.vis.set('datasetId', this.datasetId);
				this.vis.set('elasticsearchQuery', this.elasticsearchQuery);
				if (this.datasetId) {
					this.vis.reload();
				}
			}));
		}
	});
});
