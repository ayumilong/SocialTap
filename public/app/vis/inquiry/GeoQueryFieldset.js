define(['dojo/_base/declare',
		'dojo/dom-construct',
		'dojox/mobile/Pane',
		'dojox/mobile/TextBox',
		'../../util/Select'
], function(declare, domConstruct, Pane, TextBox, Select) {
	return declare([Pane], {

		'class': 'geoQueryFieldset',

		latField: null,

		lngField: null,

		distanceField: null,

		unitsSelect: null,

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('label', {
				innerHTML: this.label || 'Geo'
			}, this.domNode);

			var fieldsetNode = domConstruct.create('fieldset', {}, this.domNode);

			this.latField = new TextBox({
				'class': 'latField',
				placeHolder: 'Lat',
				trim: true
			});
			this.latField.placeAt(fieldsetNode);

			domConstruct.create('label', {
				'for': this.latField.get('id'),
				innerHTML: 'Near'
			}, this.latField.domNode, 'before');

			this.lngField = new TextBox({
				'class': 'lngField',
				placeHolder: 'Lng',
				trim: true
			});
			this.lngField.placeAt(fieldsetNode);

			var div = domConstruct.create('div', {}, fieldsetNode);

			this.distanceField = new TextBox({
				placeHolder: 'Distance',
				trim: true
			});
			this.distanceField.placeAt(div);

			domConstruct.create('label', {
				'for': this.distanceField.get('id'),
				innerHTML: 'Within'
			}, this.distanceField.domNode, 'before');

			this.unitsSelect = new Select({
				'class': 'distanceField',
				options: [{value: 'mi', label: 'mi'}, {value: 'km', label: 'km'}]
			});
			this.unitsSelect.placeAt(div);
		},

		buildInquiryPart: function() {
			return {
				type: 'geoQuery',
				field: 'geo.coordinates',
				near: {
					lat: this.latField.get('value'),
					lng: this.lngField.get('value')
				},
				distance: {
					value: this.distanceField.get('value'),
					units: this.unitsSelect.get('value')
				}
			};
		},

		reset: function() {
			this.latField.set('value', '');
			this.lngField.set('value', '');
			this.distanceField.set('value', '');
			this.unitsSelect.set('value', 'miles');
		}

	});
});
