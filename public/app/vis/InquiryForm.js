define(['dojo/_base/declare',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/Evented',
		'dojo/text!./InquiryForm.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
], function(declare, domAttr, domClass, Evented, template, _WidgetBase, _TemplatedMixin)
{
	return declare([_WidgetBase, _TemplatedMixin, Evented], {

		// advancedMode: Boolean
		//     Whether or not to show advanced filter controls.
		advancedMode: false,

		baseClass: 'inquiryForm',

		templateString: template,

		clear: function() {
			// summary:
			//     Clear form and remove filter from visualization.
			console.warn('clear');

			var inputs = [this.textQueryNode, this.dateRangeStartNode, this.dateRangeEndNode,
				this.geoLatNode, this.geoLonNode, this.geoDistanceNode];
			inputs.forEach(function(i) {
				domAttr.set(i, 'value', '');
			});

			this.emit('inquiry', this.get('elasticsearchQuery'));
		},

		submit: function(e) {
			// summary:
			//     Set filter on visualization.
			e.preventDefault();
			this.emit('inquiry', this.get('elasticsearchQuery'));
		},

		toggleAdvancedMode: function() {
			// summary:
			//     Show/hide advanced filter controls.
			this.set('advancedMode', !this.get('advancedMode'));
		},

		_setAdvancedModeAttr: function(advancedMode) {
			this._set('advancedMode', advancedMode);

			if (advancedMode) {
				domClass.remove(this.advancedFiltersNode, 'hidden');
				this.advancedModeToggle.innerHTML = 'Basic';
			}
			else {
				domClass.add(this.advancedFiltersNode, 'hidden');
				this.advancedModeToggle.innerHTML = 'Advanced';
			}
		},

		_getElasticsearchQueryAttr: function() {
			// summary:
			//     Convert inquiry into Elasticsearch filtered query.

			var inquiry = this.get('inquiry');

			var filters = [];
			var filterType, part, filter;
			for (filterType in inquiry) {
				if (inquiry.hasOwnProperty(filterType)) {

					part = inquiry[filterType];
					filter = {};

					// Text filter
					if (filterType == 'text') {
						filter.term = {};
						filter.term[part.field] = part.value;
					}

					// Date filter
					else if (filterType == 'date') {
						filter.range = {};
						filter.range[part.field] = {};
						if (part.start) {
							filter.range[part.field].gte = part.start;
						}
						if (part.end) {
							filter.range[part.field].lte = part.end;
						}
					}

					// Geo filter
					else if (filterType == 'geo') {
						filter = {
							and: [
								{
									geo_distance: {
										distance: part.distance.value + part.distance.unit
									}
								},
								{
									exists: {
										field: part.field
									}
								}
							]
						};
					}

					// Add filter to list
					if (Object.keys(filter).length !== 0) {
						filters.push(filter);
					}
				}
			}

			// Return match all query if there were no filters.
			var query;
			if (filters.length > 0) {
				if (filters.length === 1) {
					filter = filters[0];
				}
				else {
					filter = {
						and: {
							filters: filters
						}
					};
				}
				query = {
					query: {
						filtered: {
							query: {
								match_all: {}
							},
							filter: filter
						}
					}
				};
			}
			else {
				query = {
					query: {
						match_all: {}
					}
				};
			}
			return query;
		},

		_getInquiryAttr: function() {
			// summary:
			//     Get inquiry object from form contents.

			var inquiry = {};

			// Text
			var textQuery = domAttr.get(this.textQueryNode, 'value');
			if (textQuery) {
				inquiry.text = {
					field: 'body',
					value: textQuery
				};
			}

			// Date
			var rangeStart = domAttr.get(this.dateRangeStartNode, 'value');
			var rangeEnd = domAttr.get(this.dateRangeEndNode, 'value');
			if (rangeStart || rangeEnd) {
				inquiry.date = {
					field: 'postedTime'
				};
			}
			if (rangeStart) {
				inquiry.date.start = rangeStart;
			}
			if (rangeEnd) {
				inquiry.date.end = rangeEnd;
			}

			// Geo
			var lat = domAttr.get(this.geoLatNode, 'value');
			var lon = domAttr.get(this.geoLonNode, 'value');
			var distance = domAttr.get(this.geoDistanceNode, 'value');
			var unit = domAttr.get(this.geoDistanceUnitsNode, 'value');
			if (lat && lon && distance) {
				inquiry.geo = {
					field: 'socialtap.geo_coordinate',
					lat: lat,
					lon: lon,
					distance: {
						value: distance,
						unit: unit
					}
				};
			}

			return inquiry;
		}

	});
});
