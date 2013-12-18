define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojox/mobile/Pane',
		'app/util/Select'
], function(declare, lang, domConstruct, Pane, Select) {
	return declare([Pane], {

		csvDelimiterSelect: null,

		csvQuoteSelect: null,

		optionsPane: null,

		formatNodesNode: null,

		formatSelect: null,

		value: null,

		buildRendering: function() {
			this.inherited(arguments);

			this.formatSelect = new Select({
				options: [
					{value: "Json", label: "JSON"},
					{value: "Csv", label: "CSV"}
				],
				'onChange': lang.hitch(this, function(value) {
					this.showNotesForFileFormat(value);
					if (this.optionsPane) {
						this.optionsPane.destroy();
						this.optionsPane = null;
					}
					if (value == 'Csv') {
						this._buildCsvOptionsForm();
					}
				})
			});
			this.formatSelect.placeAt(this.domNode);
			this.formatSelect.startup();

			domConstruct.create('label', {
				'class': 'heading',
				'for': this.formatSelect.get('id'),
				innerHTML: 'File Format'
			}, this.formatSelect.domNode, 'before');

			this.fileFormatNotesNode = domConstruct.create('p', {}, this.domNode);
			this.showNotesForFileFormat(this.formatSelect.get('value'));
		},

		showNotesForFileFormat: function(format) {
			var notes = null;
			switch (format) {
				case 'Json':
					notes = 'One JSON encoded item per line.';
					break;
				case 'Csv':
					notes = 'Select options below:';
					break;
			}
			this.fileFormatNotesNode.innerHTML = notes;
		},

		_buildCsvOptionsForm: function() {
			this.optionsPane = new Pane();
			this.optionsPane.placeAt(this.domNode);
			this.optionsPane.startup();

			this.csvDelimiterSelect = new Select({
				options: [
					{value: ',', label: 'Comma'},
					{value: '\t', label: 'Tab'}
				]
			});
			this.csvDelimiterSelect.placeAt(this.optionsPane.domNode);
			this.csvDelimiterSelect.startup();

			domConstruct.create('label', {
				'class': 'heading',
				'for': this.csvDelimiterSelect.get('id'),
				innerHTML: 'Column Separator'
			}, this.csvDelimiterSelect.domNode, 'before');

			this.csvQuoteSelect = new Select({
				options: [
					{value: '"', label: 'Double Quote'},
					{value: '\'', label: 'Single Quote'}
				]
			});
			this.csvQuoteSelect.placeAt(this.optionsPane.domNode);
			this.csvQuoteSelect.startup();

			domConstruct.create('label', {
				'class': 'heading',
				'for': this.csvQuoteSelect.get('id'),
				innerHTML: 'Quote Character'
			}, this.csvQuoteSelect.domNode, 'before');
		},

		getValue: function() {

			var val = {
				type: this.formatSelect.get('value') + 'DataMapping'
			};

			if (val.type == 'CsvDataMapping') {
				val.options = {
					col_sep: this.csvDelimiterSelect.get('value'),
					quote_char: this.csvQuoteSelect.get('value')
				};
			}

			return val;
		},

		reset: function() {
			this.formatSelect.set('value', 'Json');
		}

	});
});
