define(['dojo/_base/lang',
		'dojo/Deferred',
		'dojo/request/xhr'
], function(lang, Deferred, xhr) {

	var Inquiry = function() {

		// datasetId: Integer
		//     The ID of the dataset this inquiry is associated with.
		this.datasetId = null;

		this.definition = {
			// Filter by date range or day of the week.
			dateFilter: {
				field: null,
				range: {
					start: null,
					end: null
				},
				days: []
			},
			// Filter by distance from a location.
			geoFilter: {
				field: null,
				lat: null,
				lon: null,
				distance: {
					value: null,
					unit: null
				}
			},
			// Filter by the presence of term(s) in one or more fields.
			textFilter: {
				value: null,
				fields: []
			}
		};

		// description: String
		//     User supplied description of this inquiry.
		this.description = null;

		// id: Integer
		//     Resource ID of this inquiry.
		this.id = null;

		// keep: Boolean
		//     Whether or not this inquiry is permanently saved.
		this.keep = false;
	};

	Inquiry.prototype.elasticsearchQuery = function() {

		var filters = [];
		var filter;
		var i;

		// Text filter
		if (this.definition.textFilter.fields.length > 0 && this.definition.textFilter.value) {
			filter = {};
			if (this.definition.textFilter.fields.length === 1) {
				filter.terms = {};
				filter.terms[this.definition.textFilter.fields[0]] = this.definition.textFilter.value.split(' ');
			}
			else {
				filter.or = [];
				for (i = 0; i < this.definition.textFilter.fields.length; i++) {
					var f = { terms: {} };
					f.terms[this.definition.textFilter.fields[i]] = this.definition.textFilter.value.split(' ');
					filter.or.push(f);
				}
			}
			filters.push(filter);
		}

		if (this.definition.dateFilter.field && this.definition.dateFilter.range.start || this.definition.dateFilter.range.end) {
			filter = { range: {} };
			filter.range[this.definition.dateFilter.field] = {};
			if (this.definition.dateFilter.range.start) {
				filter.range[this.definition.dateFilter.field].gte = this.definition.dateFilter.range.start;
			}
			if (this.definition.dateFilter.range.end) {
				filter.range[this.definition.dateFilter.field].lte = this.definition.dateFilter.range.end;
			}
			filters.push(filter);
		}

		if (this.definition.dateFilter.field && this.definition.dateFilter.days.length > 0) {
			var dayFilters = [];
			for (i = 0; i < this.definition.dateFilter.days.length; i++) {
				dayFilters.push({
					script: {
						script: "((doc['postedTime'].date.millis / 86400000) % 7) == day",
						params: {
							day: ((this.definition.dateFilter.days[i] + 3) % 7)
						}
					}
				});
			}
			filter = dayFilters[0];
			if (dayFilters.length > 1) {
				filter = {
					or: dayFilters
				};
			}
			filters.push(filter);
		}

		if (this.definition.geoFilter.field && this.definition.geoFilter.lat && this.definition.geoFilter.lon &&
			this.definition.geoFilter.distance.value && this.definition.geoFilter.distance.unit)
		{
			filter = {
				and: [
					{
						geo_distance: {
							distance: this.definition.geoFilter.distance.value + this.definition.geoFilter.distance.unit
						}
					},
					{
						exists: {
							field: this.definition.geoFilter.field
						}
					}
				]
			};
			filters.push(filter);
		}

		var query;
		if (filters.length > 0) {
			if (filters.length === 1) {
				filter = filters[0];
			}
			else {
				filter = { and: { filters: filters } };
			}
			query = { query: { filtered: { query: { match_all: {} }, filter: filter } } };
		}
		else {
			query = { query: { match_all: {} } };
		}

		return query;
	};

	Inquiry.loadAll = function(params) {
		var d = new Deferred();

		var url = '/api/v0/inquiries';

		if (params) {
			var parts = [];
			for (var key in params) {
				if (params.hasOwnProperty(key)) {
					parts.push(key + '=' + params[key]);
				}
			}
			url += '?' + parts.join('&');
		}

		xhr.get(url, {
			handleAs: 'json',
			headers: { 'Accept': 'application/json' }
		}).response.then(
			function(response) {
				var inquiries = [];
				for (var i = 0; i < response.data.length; i++) {
					var inquiry = new Inquiry();
					inquiry.id = response.data[i].id;
					inquiry.datasetId = response.data[i].dataset_id;
					inquiry.description = response.data[i].description;
					inquiry.keep = response.data[i].keep;
					for (var key in response.data[i].definition) {
						if (response.data[i].definition.hasOwnProperty(key)) {
							inquiry.definition[key] = response.data[i].definition[key];
						}
					}
					inquiries.push(inquiry);
				}
				d.resolve(inquiries);
			},
			function(err) {
				d.reject(err);
			});

		return d.promise;
	};

	Inquiry.prototype.load = function() {
		var d = new Deferred();

		if (!this.id) {
			d.reject('Cannot load inquiry without an ID');
		}

		else {
			xhr.get('/api/v0/inquiries/' + this.id, {
				handleAs: 'json',
				headers: { 'Accept': 'application/json' }
			}).response.then(
				lang.hitch(this, function(response) {
					this.datasetId = response.data.dataset_id;
					this.description = response.data.description;
					this.keep = response.data.keep;
					for (var key in response.data.definition) {
						if (response.data.definition.hasOwnProperty(key)) {
							this.definition[key] = response.data.definition[key];
						}
					}
					d.resolve(this);
				}),
				function(err) {
					d.reject(err);
				}
			);
		}

		return d.promise();
	};

	Inquiry.prototype.save = function() {

		var d = new Deferred();

		var definition = {};
		for (var key in this.definition) {
			if (this.definition.hasOwnProperty(key)) {
				definition[key] = this.definition[key];
			}
		}

		var data = JSON.stringify({
			inquiry: {
				dataset_id: this.datasetId,
				definition: definition,
				description: this.description,
				keep: this.keep
			}
		});

		if (this.id) {
			xhr.put('/api/v0/inquiries/' + this.id, {
				data: data,
				handleAs: 'json',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			}).response.then(
				lang.hitch(this, function() {
					d.resolve(this);
				}),
				function(err) {
					d.reject(err);
				}
			);
		}
		else {
			xhr.post('/api/v0/inquiries', {
				data: data,
				handleAs: 'json',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			}).response.then(
				lang.hitch(this, function(response) {
					this.id = response.data.id;
					d.resolve(this);
				}),
				function(err) {
					d.reject(err);
				}
			);
		}

		return d.promise;
	};

	Inquiry.definitionToString = function(definition) {
		var parts = [];

		if (definition.textFilter.value && definition.textFilter.fields) {
			parts.push('Search for "' + definition.textFilter.value + '" in ' + definition.textFilter.fields.join(', '));
		}

		if (definition.dateFilter.range.start && definition.dateFilter.range.end) {
			parts.push('Between ' + definition.dateFilter.range.start + ' and ' + definition.dateFilter.range.end);
		}
		else if (definition.dateFilter.range.start) {
			parts.push('After ' + definition.dateFilter.range.start);
		}
		else if (definition.dateFilter.range.end) {
			parts.push('Before ' + definition.dateFilter.range.end);
		}

		var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		if (definition.dateFilter.days && definition.dateFilter.days.length > 0) {
			parts.push(days.filter(lang.hitch(this, function(day, i) { return definition.dateFilter.days.indexOf(i) !== -1; })).join(', '));
		}

		if (definition.geoFilter.field && definition.geoFilter.lat && definition.geoFilter.lon &&
			definition.geoFilter.distance.value && definition.geoFilter.distance.unit)
		{
			parts.push('Within ' + definition.geoFilter.distance.value + ' ' + definition.geoFilter.distance.unit + ' of ' + definition.geoFilter.lat + ',' + definition.geoFilter.lon);
		}

		if (parts.length > 0) {
			return parts.join('\n');
		}
		else {
			return 'Match all';
		}
	};

	Inquiry.prototype.toString = function() {
		return Inquiry.definitionToString(this.definition);
	};

	return Inquiry;
});
