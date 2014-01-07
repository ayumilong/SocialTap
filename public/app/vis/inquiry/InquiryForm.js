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

		advancedMode: false,

		advancedButton: null,

		advancedOptionsNode: null,

		baseFieldset: null,

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

		inquiryToElasticsearch: function(/*Array*/inquiry) {

			var esFilter = {};

			var i, part;
			for (i = 0; i < inquiry.length; i++) {
				part = inquiry[i];

				if (part.type === 'textQuery') {
					esFilter.term = {};
					esFilter.term[part.fields[0]] = part.value;
				}
			}

			return {
				query: {
					filtered: {
						query: {
							match_all: {}
						},
						filter: esFilter
					}
				}
			};

		},

		reset: function() {
			this.baseFieldset.reset();
			var i;
			for (i = 0; i < this.advancedFieldsets.length; i++) {
				this.advancedFieldsets[i].reset();
			}
			this.emit('submit', null);
		},

		search: function() {
			var inquiry = [this.baseFieldset.buildInquiryPart()];

			if (this.advancedMode) {
				var i;
				for (i = 0; i < this.advancedFieldsets.length; i++) {
					inquiry.push(this.advancedFieldsets[i].buildInquiryPart());
				}
			}

			var esQuery = this.inquiryToElasticsearch(inquiry);

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
