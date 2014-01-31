define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/Evented',
		'dojo/keys',
		'dojo/on',
		'dojo/query',
		'dojo/request/xhr',
		'dojo/text!./InquiryForm.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
], function(declare, lang, domAttr, domClass, Evented, keys, on, query, xhr, template, _WidgetBase, _TemplatedMixin)
{
	return declare([_WidgetBase, _TemplatedMixin, Evented], {

		// advancedMode: Boolean
		//     Whether or not to show advanced filter controls.
		advancedMode: false,

		baseClass: 'inquiryForm',

		// datasetId: Integer
		//     ID of the dataset currently being visualized.
		datasetId: null,

		// inquiry: Object
		//     The definition of the current inquiry.
		inquiry: null,

		// savedInquiryId: Integer
		//     The ID of the last saved inquiry displayed.
		//     Set when an inquiry is saved (not submitted).
		savedInquiryId: null,

		templateString: template,

		clear: function() {
			// summary:
			//     Clear form and remove filter from visualization.
			console.warn('clear');

			this.clearForm();

			this.set('savedInquiryId', null);

			this.emit('inquiry', this.get('elasticsearchQuery'));
		},

		clearForm: function() {
			var inputs = [this.textQueryNode, this.dateRangeStartNode, this.dateRangeEndNode,
				this.geoLatNode, this.geoLonNode, this.geoDistanceNode];
			inputs.forEach(function(node) {
				node.value = '';
			});

			inputs = query('input[type="checkbox"]', this.textQueryFieldsNode);
			inputs.forEach(function(check, i) {
				check.checked = (i === 0);
			});

			inputs = query('input[type="checkbox"]', this.dateFilterNode);
			inputs.forEach(function(check) {
				check.checked = false;
			});
		},

		postCreate: function() {
			this.inherited(arguments);

			on(this.domNode, 'keydown', lang.hitch(this, function(e) {
				if (e.keyCode == keys.ENTER) {
					this.submit();
				}
			}));

			on(this.saveCheck, 'change', lang.hitch(this, function() {
				if (this.saveCheck.checked) {
					domClass.remove(this.descriptionContainer, 'hidden');
				}
				else {
					domClass.add(this.descriptionContainer, 'hidden');
				}
			}));
		},

		submit: function(e) {
			// summary:
			//     Set filter on visualization.
			if (e) {
				e.preventDefault();
			}

			var inquiry = this.get('inquiry');

			if (inquiry) {
				this.emit('inquiry', this.get('elasticsearchQuery'));

				xhr.post('/api/v0/inquiries', {
					data: JSON.stringify({
						inquiry: {
							dataset_id: this.get('datasetId'),
							definition: inquiry
						}
					}),
					handleAs: 'json',
					headers: { 'Content-Type': 'application/json' }
				}).response.then(
					null,
					lang.hitch(this, function(err) {
						console.error(err);
					}));
			}
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

			console.log('inquiry');
			console.log(inquiry);

			var filters = [];
			var filterType, part, filter;
			for (filterType in inquiry) {
				if (inquiry.hasOwnProperty(filterType)) {

					part = inquiry[filterType];
					filter = {};

					// Text filter
					if (filterType == 'text') {
						if (part.fields.length === 1) {
							filter.terms = {};
							filter.terms[part.fields[0]] = part.value.split(' ');
						}
						else {
							filter.or = [];
							for (var i = 0; i < part.fields.length; i++) {
								var f = { terms: {} };
								f.terms[part.fields[i]] = part.value.split(' ');
								filter.or.push(f);
							}
						}
					}

					// Date filter
					else if (filterType == 'date') {
						var rangeFilter = null;
						if (part.range) {
							rangeFilter = { range: {} };
							rangeFilter.range = {};
							rangeFilter.range[part.field] = {};
							if (part.range.start) {
								rangeFilter.range[part.field].gte = part.range.start;
							}
							if (part.range.end) {
								rangeFilter.range[part.field].lte = part.range.end;
							}
						}

						var daysFilter = null;
						if (part.days) {
							var dayFilters = [];
							for (var j = 0; j < part.days.length; j++) {
								dayFilters.push({
									script: {
										script: "((doc['postedTime'].date.millis / 86400000) % 7) == day",
										params: {
											day: ((part.days[j] + 3) % 7)
										}
									}
								});
							}
							if (dayFilters.length == 1) {
								daysFilter = dayFilters[0];
							}
							else {
								daysFilter = {
									or: dayFilters
								};
							}
						}

						if (rangeFilter) {
							filter = rangeFilter;
						}
						if (daysFilter) {
							filter = daysFilter;
						}
						if (rangeFilter && daysFilter) {
							filter = {
								and: [
									rangeFilter,
									daysFilter
								]
							};
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

			console.log('elasticsearch query');
			console.log(query);

			return query;
		},

		_getInquiryAttr: function() {
			// summary:
			//     Get inquiry object from form contents.

			var inquiry = {};

			// Text
			var nodes = query('input[type="checkbox"]', this.textQueryFieldsNode);
			var fields = [];
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].checked) {
					fields.push(nodes[i].value);
				}
			}

			var textQuery = domAttr.get(this.textQueryNode, 'value');
			if (textQuery) {
				inquiry.text = {
					fields: fields,
					value: textQuery
				};
			}

			// Date
			var rangeStart = domAttr.get(this.dateRangeStartNode, 'value');
			var rangeEnd = domAttr.get(this.dateRangeEndNode, 'value');
			var dayNodes = query('input[type="checkbox"]:checked', this.dateFilterNode);
			var days = [];
			for (i = 0; i < dayNodes.length; i++) {
				days.push(parseInt(dayNodes[i].value, 10));
			}

			if (rangeStart || rangeEnd || days.length > 0) {
				inquiry.date = {
					field: 'postedTime'
				};
			}
			if (rangeStart) {
				inquiry.date.range = inquiry.date.range || {};
				inquiry.date.range.start = rangeStart;
			}
			if (rangeEnd) {
				inquiry.date.range = inquiry.date.range || {};
				inquiry.date.range.end = rangeEnd;
			}
			if (days.length > 0) {
				inquiry.date.days = days;
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

			if (Object.keys(inquiry).length === 0) {
				inquiry = null;
			}

			return inquiry;
		},

		_setInquiryAttr: function(inquiry) {
			this.clearForm();

			if (inquiry === null) {
				inquiry = {};
			}

			var type, part, nodes, i;
			for (type in inquiry) {
				if (inquiry.hasOwnProperty(type)) {
					part = inquiry[type];
					if (type === 'text') {
						this.textQueryNode.value = part.value;
						nodes = query('input[type="checkbox"]', this.textQueryFieldsNode);
						for (i = 0; i < nodes.length; i++) {
							nodes[i].checked = (part.fields.indexOf(nodes[i].value) !== -1);
						}
					}

					else if (type === 'date') {
						this.dateRangeStartNode.value = (part.range && part.range.start) ? part.range.start : '';
						this.dateRangeEndNode.value = (part.range && part.range.end) ? part.range.end : '';

						nodes = query('input[type="checkbox"]:checked', this.dateFilterNode);
						for (i = 0; i < nodes.length; i++) {
							nodes[i].checked = (part.days && part.days.indexOf(parseInt(nodes[i].value, 10)) !== -1);
						}
					}

					else if (type === 'geo') {
						this.geoDistanceNode.value = part.distance.value;
						this.geoDistanceUnitsNode.value = part.distance.unit;
						this.geoLatNode.value = part.lat;
						this.geoLonNode.value = part.lon;
					}
				}
			}
		}

	});
});
