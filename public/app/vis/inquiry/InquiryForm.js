define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/Evented',
		'dojox/mobile/Button',
		'dojox/mobile/Pane',
		'./DateQueryFieldset',
		'./GeoQueryFieldset',
		'./SentimentQueryFieldset',
		'./TextQueryFieldset'
], function(declare, lang, domClass, domConstruct, Evented, Button, Pane,
	DateQueryFieldset, GeoQueryFieldset, SentimentQueryFieldset, TextQueryFieldset)
{
	return declare([Pane, Evented], {

		'class': 'inquiryForm',

		// advancedMode: Boolean
		//     Whether or not the advanced fieldsets are shown and used
		//     in the generated Elasticsearch query.
		advancedMode: false,

		// advancedButton: Object
		//     Button to toggle between Advanced/Basic search.
		advancedButton: null,

		// advancedOptionsNode: DomNode
		//     Node containing advanced fieldsets.
		advancedOptionsNode: null,

		// baseFieldset: Object
		//     Only fieldset used to generate query if in basic mode.
		baseFieldset: null,

		// advancedFieldsets: Array
		//     Additional fieldsets used to generate query if in
		//     advanced mode.
		advancedFieldsets: null,

		buildRendering: function() {
			this.inherited(arguments);

			this.baseFieldset = new TextQueryFieldset({
				label: 'Filter by text'
			});
			this.baseFieldset.placeAt(this.domNode);

			this.advancedOptionsNode = domConstruct.create('div', {
				'class': 'advancedPane hidden'
			}, this.domNode);

			this.advancedFieldsets = [];

			var dqf = new DateQueryFieldset({
				label: 'Filter by post date'
			});
			dqf.placeAt(this.advancedOptionsNode);
			this.advancedFieldsets.push(dqf);

			var sqf = new SentimentQueryFieldset({
				label: 'Filter by sentiment'
			});
			sqf.placeAt(this.advancedOptionsNode);
			this.advancedFieldsets.push(sqf);

			var gqf = new GeoQueryFieldset({
				label: 'Filter by location'
			});
			gqf.placeAt(this.advancedOptionsNode);
			this.advancedFieldsets.push(gqf);

			var searchButton = new Button({
				'class': 'searchButton button',
				duration: 0,
				label: 'Search',
				onClick: lang.hitch(this, this.search)
			});
			searchButton.placeAt(this.domNode);

			var clearButton = new Button({
				'class': 'clearButton button',
				duration: 0,
				label: 'Clear',
				onClick: lang.hitch(this, this.reset)
			});
			clearButton.placeAt(this.domNode);

			this.advancedButton = new Button({
				'class': 'advancedButton button',
				label: 'Advanced',
				duration: 0,
				onClick: lang.hitch(this, function() {
					this.set('advancedMode', !this.advancedMode);
				})
			});
			this.advancedButton.placeAt(this.domNode);
		},

		inquiryPartToElasticsearch: function(/*Object*/part) {
			var filter = {};
			if (part.type === 'text') {
				filter.term = {};
				filter.term[part.fields[0]] = part.value;
			}

			else if (part.type === 'date') {
				if (part.range) {
					filter.range = {};
					filter.range[part.field] = {};
					if (part.range.start) {
						filter.range[part.field].gte = part.range.start;
					}
					if (part.range.end) {
						filter.range[part.field].lte = part.range.end;
					}
				}
			}

			else if (part.type == 'geo') {
				filter.geo_distance = {
					distance: part.distance.value + part.distance.units
				};
				filter.geo_distance[part.field] = [part.near.lat, part.near.lng];
				filter = {
					and: [
						filter,
						{
							exists: {
								field: part.field
							}
						}
					]
				};
			}

			else if (part.type == 'sentiment') {

			}

			return filter;
		},

		inquiryToElasticsearch: function(/*Array*/inquiry) {
			// summary:
			//     Generate Elasticsearch query from inquiry.
			//     Query matches all documents but filters based on
			//     values of this form's fieldsets.

			if (inquiry.length === 0) {
				return null;
			}

			var filterParts = [];
			var i;
			for (i = 0; i < inquiry.length; i++) {
				filterParts.push(this.inquiryPartToElasticsearch(inquiry[i]));
			}

			var filter = {};

			if (filterParts.length === 0) {
				filter = filterParts[0];
			}

			// If there are multiple parts to the inquiry, 'and' them together
			// in the Elasticsearch query.
			else {
				filter = {
					and: filterParts
				};
			}

			return {
				query: {
					filtered: {
						query: {
							match_all: {}
						},
						filter: filter
					}
				}
			};

		},

		reset: function() {
			// summary:
			//     Reset all fieldsets and emit event with null query.
			this.baseFieldset.reset();
			var i;
			for (i = 0; i < this.advancedFieldsets.length; i++) {
				this.advancedFieldsets[i].reset();
			}
			this.emit('submit', null);
		},

		search: function() {
			// summary:
			//   Build Elasticsearch query from fieldsets and emit event to
			//   notify listeners of new query.

			var inquiry = [];

			var basePart = this.baseFieldset.buildInquiryPart();
			if (basePart) {
				inquiry.push(basePart);
			}

			if (this.advancedMode) {
				console.log('advanced mode');
				var i, part;
				for (i = 0; i < this.advancedFieldsets.length; i++) {
					console.log('add set ' + i);
					part = this.advancedFieldsets[i].buildInquiryPart();
					if (part) {
						inquiry.push(part);
					}
				}
			}

			console.log(inquiry);

			var esQuery = this.inquiryToElasticsearch(inquiry);

			console.log(JSON.stringify(esQuery));
			console.log(esQuery);

			this.emit('submit', esQuery);
		},

		_setAdvancedModeAttr: function(/*Boolean*/advancedMode) {
			this._set('advancedMode', advancedMode);

			if (advancedMode) {
				domClass.remove(this.advancedOptionsNode, 'hidden');
				this.advancedButton.set('label', 'Basic');
			}
			else {
				domClass.add(this.advancedOptionsNode, 'hidden');
				this.advancedButton.set('label', 'Advanced');
			}
		}

	});
});
