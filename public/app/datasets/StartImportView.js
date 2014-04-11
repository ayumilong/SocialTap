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

			var typeFields = [];
			if (sourceType === 'file') {
				typeFields = [
					{
						label: 'File to be imported',
						name: 'source_spec.path',
						placeholder: '/path/to/file/',
						type: 'text'
					},
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

				this.form = new Form({
					fields: [
						{
							type: 'hidden',
							name: 'source_type',
							value: sourceType
						}
					].concat(typeFields)
					.concat([
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
					]),
					modifyValue: function(val) {
						if (val.convert === false) {
							delete val.from_format;
							delete val.to_format;
						}
						return val;
					},
					name: 'import_operation',
					url: '/api/v0/datasets/' + this.datasetId + '/imports'
				});

				// Hide 'Convert' option if there are no conversions available
				domClass[(typeConversions.length === 0) ? 'add' : 'remove'](this.form.fields[2].containerNode, 'hidden');

				domClass.add(this.form.fields[2].containerNode, 'inline');
				domClass.add(this.form.fields[3].containerNode, 'inline hidden');
				domClass.add(this.form.fields[4].containerNode, 'inline hidden');

				this.updateConversionToOptions(this.form.fields[3].domNode.value);

				this.form.on('field_change', lang.hitch(this, function(e) {
					if (e.field === 'convert') {
						var f = e.value ? domClass.remove : domClass.add;
						f(this.form.fields[3].containerNode, 'hidden');
						f(this.form.fields[4].containerNode, 'hidden');
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
			domConstruct.empty(this.form.fields[4].domNode);
			toFormats.forEach(lang.hitch(this, function(f) {
				domConstruct.create('option', {
					innerHTML: f.formatSymbolForDisplay(),
					value: f
				}, this.form.fields[4].domNode);
			}));
		}

	});
});
