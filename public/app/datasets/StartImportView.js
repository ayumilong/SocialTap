define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojo/text!./StartImportView.html',
		'dojo/when',
		'dojo-mama/views/_ModuleViewMixin',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'app/util/Form'
], function(declare, lang, domAttr, domClass, domConstruct, xhr, template, when, _ModuleViewMixin,
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

			when(this.loadConversions(), lang.hitch(this, function(conversions) {

				// Filter conversions based on source type
				var typeConversions = [];
				conversions.forEach(function(conversion) {
					if ((sourceType === 'file') ||
						(sourceType === 'gnip' && conversion.from === 'activity_stream') ||
						(sourceType === 'twitter' && conversion.from === 'twitter'))
					{
						typeConversions.push(conversion);
					}
				});

				var fields = [
					{
						type: 'hidden',
						name: 'source_type',
						value: sourceType
					},
					{
						label: 'Convert imported data',
						name: 'convert',
						type: 'checkbox'
					},
					{
						label: 'From',
						name: 'from_format',
						type: 'select',
						options: typeConversions.map(function(c) { return c.from; }).uniqueValues().map(function(format) {
							return { label: format.formatSymbolForDisplay(), value: format };
						})
					},
					{
						label: 'To',
						name: 'to_format',
						type: 'select',
						options: []
					}
				];

				if (sourceType === 'file') {
					fields.splice(1, 0, {
						label: 'File to be imported',
						name: 'source_spec.path',
						placeholder: '/path/to/file/',
						type: 'text'
					});
					fields.splice(5, 0, {
						label: 'Preserve fields',
						name: 'source_spec.preserve_fields',
						type: 'array'
					});
				}
				else if (sourceType === 'gnip') {
					fields.splice(1, 0, {
						label: 'Rule',
						name: 'source_spec.rule',
						placeholder: 'Gnip rule',
						type: 'text'
					});
				}

				this.form = new Form({
					fields: fields,
					modifyValue: function(val) {
						if (val.convert === false) {
							delete val.from_format;
							delete val.to_format;
							if (sourceType === 'file') {
								delete val.source_spec.preserve_fields;
							}
						}
						return val;
					},
					name: 'import_operation',
					url: '/api/v0/datasets/' + this.datasetId + '/imports'
				});

				// Hide 'Convert' option if there are no conversions available
				domClass[(typeConversions.length === 0) ? 'add' : 'remove'](this.form.getField('convert').containerNode, 'hidden');

				domClass.add(this.form.getField('convert').containerNode, 'inline');
				domClass.add(this.form.getField('from_format').containerNode, 'inline hidden');
				domClass.add(this.form.getField('to_format').containerNode, 'inline hidden');
				if (sourceType === 'file') {
					domConstruct.create('p', {
						innerHTML: 'These fields will be copied into the stored document after format conversion under the \'socialtap.preserved_fields\' key.',
						style: { margin: '0 0 5px 0' }
					}, this.form.getField('source_spec.preserve_fields').domNode, 'first');
					domClass.add(this.form.getField('source_spec.preserve_fields').containerNode, 'hidden');
				}

				this.updateConversionToOptions(this.form.getField('from_format').domNode.value);

				this.form.on('field_change', lang.hitch(this, function(e) {
					if (e.field === 'convert') {
						var f = e.value ? domClass.remove : domClass.add;
						f(this.form.getField('from_format').containerNode, 'hidden');
						f(this.form.getField('to_format').containerNode, 'hidden');
						if (sourceType === 'file') {
							f(this.form.getField('source_spec.preserve_fields').containerNode, 'hidden');
						}
					}

					if (e.field === 'from_format') {
						this.updateConversionToOptions(e.value);
					}
				}));

				this.form.on('success', lang.hitch(this, function() {
					this.router.go('/' + this.datasetId);
				}));

				this.form.placeAt(this.formContainerNode);
			}));
		},

		cancelButtonClicked: function() {
			this.router.go('/' + this.datasetId);
		},

		loadConversions: function() {
			if (this.conversions !== undefined) {
				return this.conversions;
			}
			else {
				return xhr.get('/api/v0/imports/format_conversions', {
					handleAs: 'json'
				}).then(lang.hitch(this, function(conversions) {
					this.conversions = conversions;
					return conversions;
				}));
			}
		},

		updateConversionToOptions: function(fromFormat) {
			var toFormats = this.conversions.filter(function(c) { return c.from === fromFormat; }).map(function(c) { return c.to; }).uniqueValues();
			domConstruct.empty(this.form.getField('to_format').domNode);
			toFormats.forEach(lang.hitch(this, function(f) {
				domConstruct.create('option', {
					innerHTML: f.formatSymbolForDisplay(),
					value: f
				}, this.form.getField('to_format').domNode);
			}));
		}

	});
});
