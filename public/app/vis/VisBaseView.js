define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo-mama/views/ModuleView'
], function(declare, lang, ModuleView) {
	return declare([ModuleView], {

		datasetId: null,

		inquiryPane: null,

		// vis: Object
		//     The visualization for this view.
		vis: null,

		// visModuleId: String
		//     The AMD module ID for the visualization to load for this view.
		visModuleId: null,

		activate: function(e) {
			this.inherited(arguments);
			this.set('datasetId', e.params.dataset_id);
			if (this.vis) {
				this.vis.set('active', true);
			}
		},

		deactivate: function() {
			this.inherited(arguments);
			if (this.vis) {
				this.vis.set('active', false);
			}
		},

		startup: function() {
			this.inherited(arguments);
			// TODO:
			//   Startup inquiry pane
			//   Handle inquiry pane change event by setting inquiry property of this.vis
		},

		_setDatasetIdAttr: function(/*Integer*/datasetId) {
			this._set('datasetId', datasetId);
			if (this.vis) {
				this.vis.set('datasetId', datasetId);
				if (datasetId) {
					this.vis.reload();
				}
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
				this.vis = new VisModule({
					active: this.active,
					datasetId: this.datasetId
				});

				// TODO: Pass the inquiry from this.inquiryPane to new vis
				this.vis.placeAt(this.domNode, 'last');
				if (this.datasetId) {
					this.vis.reload();
				}
			}));
		}
	});
});
