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

			if (sourceType === 'file') {
				this.form = new Form({
					fields: [
						{
							type: 'hidden',
							name: 'source_type',
							value: 'file'
						},
						{
							label: 'File to be imported',
							name: 'source_spec.path',
							placeholder: '/path/to/file/',
							type: 'text'
						},
						{
							label: 'Convert imported data',
							name: 'source_spec.convert',
							type: 'checkbox'
						},
						// TODO: From/To format options should be loaded from /api/v0/imports/format_conversions
						{
							label: 'From',
							name: 'source_spec.from_format',
							type: 'select',
							options: [
								{ label: 'Twitter', value: 'twitter' }
							]
						},
						{
							label: 'To',
							name: 'source_spec.to_format',
							type: 'select',
							options: [
								{ label: 'Activity Stream', value: 'activity_stream' }
							]
						}
					],
					modifyValue: function(val) {
						if (val.source_spec.convert === false) {
							delete val.source_spec.from_format;
							delete val.source_spec.to_format;
						}
						return val;
					},
					name: 'import_operation',
					url: '/api/v0/datasets/' + this.datasetId + '/imports'
				});

				domClass.add(this.form.fields[2].containerNode, 'inline');
				domClass.add(this.form.fields[3].containerNode, 'inline hidden');
				domClass.add(this.form.fields[4].containerNode, 'inline hidden');

				this.form.on('field_change', lang.hitch(this, function(e) {
					if (e.field === 'source_spec.convert') {
						var f = e.value ? domClass.remove : domClass.add;
						f(this.form.fields[3].containerNode, 'hidden');
						f(this.form.fields[4].containerNode, 'hidden');
					}
				}));
			}

			else if (sourceType === 'gnip') {
				this.form = new Form({
					fields: [
						{
							type: 'hidden',
							name: 'source_type',
							value: 'gnip'
						},
						{
							label: 'Rule',
							name: 'source_spec.rule',
							placeholder: 'Gnip rule',
							type: 'text'
						}
					],
					name: 'import_operation',
					url: '/api/v0/datasets/' + this.datasetId + '/imports'
				});
			}

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
