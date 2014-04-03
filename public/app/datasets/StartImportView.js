define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojo/text!./StartImportView.html',
		'dojo-mama/views/_ModuleViewMixin',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'app/util/Form'
], function(declare, lang, domAttr, domClass, domConstruct, xhr, template, _ModuleViewMixin,
	_WidgetBase, _TemplatedMixin, Form)
{
	return declare([_WidgetBase, _TemplatedMixin, _ModuleViewMixin], {

		'class': 'datasetView',

		parentView: '/',

		route: '/(\\d+)/start_import',

		templateString: template,

		activate: function(e) {
			this.inherited(arguments);
			this.datasetId = parseInt(e.params[0]);

			this.set('sourceType', this.sourceTypeSelectNode.value);
		},

		sourceTypeChanged: function(e) {
			this.set('sourceType', e.target.value);
		},

		_setSourceTypeAttr: function(/*String*/ sourceType) {
			this._set('sourceType', sourceType);

			if (this.form) {
				this.form.destroy();
			}

			var typeFields = [];
			if (sourceType === 'file') {
				typeFields = [
					{
						label: 'File to be imported',
						name: 'source_spec.path',
						placeholder: '/path/to/file/',
						type: 'text'
					}
				];
			}
			else if (sourceType === 'gnip') {
				typeFields = [
					{
						label: 'Rule',
						name: 'source_spec.rule',
						placeholder: 'Gnip rule',
						type: 'text'
					}
				];
			}

			this.form = new Form({
				fields: [
					{
						type: 'hidden',
						name: 'source_type',
						value: sourceType
					}
				].concat(typeFields),
				name: 'import_operation',
				url: '/api/v0/datasets/' + this.datasetId + '/imports'
			});

			this.form.on('success', lang.hitch(this, function() {
				this.router.go('/' + this.datasetId);
			}));

			this.form.placeAt(this.formContainerNode);
		},

		cancelButtonClicked: function() {
			this.router.go('/' + this.datasetId);
		}

	});
});
