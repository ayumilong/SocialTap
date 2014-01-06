define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojox/mobile/Button',
		'dojox/mobile/Pane',
		'dojox/mobile/TextBox',
		'./DateQueryFieldset',
		'./GeoQueryFieldset',
		'./SentimentQueryFieldset',
		'./TextQueryFieldset'
], function(declare, lang, domConstruct, Button, Pane, TextBox, DateQueryFieldset,
	GeoQueryFieldset, SentimentQueryFieldset, TextQueryFieldset)
{
	return declare([Pane], {

		'class': 'inquiryForm',

		buildRendering: function() {
			this.inherited(arguments);

			var tqf = new TextQueryFieldset({
				label: 'Filter by text'
			});
			tqf.placeAt(this.domNode);

			var dqf = new DateQueryFieldset({
				label: 'Filter by post date'
			});
			dqf.placeAt(this.domNode);

			var sqf = new SentimentQueryFieldset({
				label: 'Filter by sentiment'
			});
			sqf.placeAt(this.domNode);

			var gqf = new GeoQueryFieldset({
				label: 'Filter by location'
			});
			gqf.placeAt(this.domNode);
		}

	});
});
