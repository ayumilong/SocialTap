define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojo-mama/views/ModuleScrollableView',
		'dijit/_WidgetBase',
		'app/util/Form'
], function(declare, lang, domAttr, domConstruct, xhr, ModuleScrollableView, _WidgetBase, Form)
{
	return declare([ModuleScrollableView], {

		'class': 'createDatasetView',

		form: null,

		parentView: '/',

		route: '/create',

		activate: function() {
			this.inherited(arguments);
			this.form.reset();
		},

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('h1', {
				innerHTML: 'Create New Dataset'
			}, this.containerNode);

			this.form = new Form({
				fields: [
					{
						name: 'name',
						placeholder: 'Dataset name',
						type: 'text'
					},
					{
						name: 'description',
						placeholder: 'Description of dataset',
						type: 'text'
					}
				],
				name: 'dataset',
				style: {
					margin: '20px 20px 0'
				},
				url: '/api/v0/datasets.json'
			});
			this.form.placeAt(this.containerNode);

			this.form.on('success', lang.hitch(this, function(dataset) {
				this.router.go('/' + dataset.id);
			}));
		}

	});
});
