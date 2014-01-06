define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojox/mobile/Button',
		'dojox/mobile/Pane',
		'dojox/mobile/TextBox',
		'./DateQueryFieldset',
		'./GeoQueryFieldset',
		'./SentimentQueryFieldset',
		'./TextQueryFieldset'
], function(declare, lang, domClass, domConstruct, Button, Pane, TextBox, DateQueryFieldset,
	GeoQueryFieldset, SentimentQueryFieldset, TextQueryFieldset)
{
	return declare([Pane], {

		'class': 'inquiryForm',

		advancedButton: null,

		advancedNode: null,

		buildRendering: function() {
			this.inherited(arguments);

			var tqf = new TextQueryFieldset({
				label: 'Filter by text'
			});
			tqf.placeAt(this.domNode);

			this.advancedNode = domConstruct.create('div', {
				'class': 'advancedPane hidden'
			}, this.domNode);

			var dqf = new DateQueryFieldset({
				label: 'Filter by post date'
			});
			dqf.placeAt(this.advancedNode);

			var sqf = new SentimentQueryFieldset({
				label: 'Filter by sentiment'
			});
			sqf.placeAt(this.advancedNode);

			var gqf = new GeoQueryFieldset({
				label: 'Filter by location'
			});
			gqf.placeAt(this.advancedNode);

			var searchButton = new Button({
				'class': 'searchButton button',
				duration: 0,
				label: 'Search'
			});
			searchButton.placeAt(this.domNode);

			this.advancedButton = new Button({
				'class': 'advancedButton button',
				label: 'Advanced',
				duration: 0,
				onClick: lang.hitch(this, function() {
					domClass.toggle(this.advancedNode, 'hidden');
					if (domClass.contains(this.advancedNode, 'hidden')) {
						this.advancedButton.set('label', 'Advanced');
					}
					else {
						this.advancedButton.set('label', 'Basic');
					}
				})
			});
			this.advancedButton.placeAt(this.domNode);


		}

	});
});
