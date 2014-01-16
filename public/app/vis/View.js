define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/on',
		'dojo/text!./View.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		'dojo-mama/views/_ModuleViewMixin',
		'./InquiryForm',
		'./OptionsPane'
], function(declare, lang, on, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _ModuleViewMixin) {
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _ModuleViewMixin], {

		'class': 'visView',

		// inquiryForm: Object
		//     Form to set inquiry to run on dataset.
		inquiryForm: null,

		route: '/:dataset_id/:vis_id',

		templateString: template,

		// vis: Object
		//     Visualization being displayed.
		vis: null,

		// visDetailsNode: DomNode
		//     Container for the visualization to display arbitrary data.
		visDetailsNode: null,

		// visDetailsHandle: Object
		//     Dojo/on handle for visualization's display_info event.
		visDetailsHandle: null,

		// visOptionsNode: DomNode
		//     Container for controls to set visualization options.
		visOptionsPane: null,

		activate: function(e) {
			this.inherited(arguments);

			// Remove old visualization.
			if (this.vis) {
				this.vis.destroy();
				this.vis = null;
			}

			// Get AMD module of new visualization.
			var visId = 'app/vis/' + e.params.vis_id.split('_')
				.map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); })
				.join('');

			// Load visualization module and create widget.
			require([visId], lang.hitch(this, function(VisModule) {
				this.vis = new VisModule();
				console.log(this.vis);
				this.vis.placeAt(this.containerNode);
				this.vis.startup();

				if (this.visDetailsHandle) {
					this.visDetailsHandle.remove();
				}
				this.visDetailsHandle = on(this.vis, 'display_info', lang.hitch(this, function(info) {
					this.visDetailsNode.innerHTML = info;
				}));

				this.vis.set('datasetId', e.params.dataset_id);
				this.vis.set('baseQuery', this.inquiryForm.get('elasticsearchQuery'));
				this.vis.reload();

				this.visOptionsPane.set('options', this.vis.get('options'));
			}));
		},

		postCreate: function() {
			this.inherited(arguments);

			// When inquiry form is changed, apply the new Elasticsearch filter to the visualization.
			this.inquiryForm.on('inquiry', lang.hitch(this, function(esQuery) {
				if (this.vis) {
					this.vis.set('elasticsearchQuery', esQuery);
					this.vis.reload();
				}
			}));

			this.visOptionsPane.on('option_set', lang.hitch(this, function(opt) {
				this.vis.set(opt.name, opt.value);
				this.vis.reload();
			}));
		}

	});
});
