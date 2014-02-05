define(['dojo/_base/lang',
		'dojo/Deferred',
		'dojo/request/xhr'
], function(lang, Deferred, xhr) {

	var Inquiry = function() {

		// datasetId: Integer
		//     The ID of the dataset this inquiry is associated with.
		this.datasetId = null;

		// dateFilter: Object
		//     Filter by date range or day of the week.
		this.dateFilter = {
			field: null,
			range: {
				start: null,
				end: null
			},
			days: []
		};

		// description: String
		//     User supplied description of this inquiry.
		this.description = null;

		// geoFilter: Object
		//     Filter by distance from a location.
		this.geoFilter = {
			field: null,
			lat: null,
			lon: null,
			distance: {
				value: null,
				unit: null
			}
		};

		// id: Integer
		//     Resource ID of this inquiry.
		this.id = null;

		// keep: Boolean
		//     Whether or not this inquiry is permanently saved.
		this.keep = false;

		// textFilter: Object
		//     Filter by the presence of term(s) in one or more fields.
		this.textFilter = {
			value: null,
			fields: []
		};
	};

	Inquiry.prototype.elasticsearchQuery = function() {

		var filters = [];
		var filter;
		var i;

		// Text filter
		if (this.textFilter.fields.length > 0 && this.textFilter.value) {
			filter = {};
			if (this.textFilter.fields.length === 1) {
				filter.terms = {};
				filter.terms[this.textFilter.fields[0]] = this.textFilter.value.split(' ');
			}
			else {
				filter.or = [];
				for (i = 0; i < this.textFilter.fields.length; i++) {
					var f = { terms: {} };
					f.terms[this.textFilter.fields[i]] = this.textFilter.value.split(' ');
					filter.or.push(f);
				}
			}
			filters.push(filter);
		}

		if (this.dateFilter.field && this.dateFilter.range.start || this.dateFilter.range.end) {
			filter = { range: {} };
			filter.range[this.dateFilter.field] = {};
			if (this.dateFilter.range.start) {
				filter.range[this.dateFilter.field].gte = this.dateFilter.range.start;
			}
			if (this.dateFilter.range.end) {
				filter.range[this.dateFilter.field].lte = this.dateFilter.range.end;
			}
			filter.push(filter);
		}

		if (this.dateFilter.field && this.dateFilter.days.length > 0) {
			var dayFilters = [];
			for (i = 0; i < this.dateFilter.days.length; i++) {
				dayFilters.push({
					script: {
						script: "((doc['postedTime'].date.millis / 86400000) % 7) == day",
						params: {
							day: ((this.dateFilter.days[i] + 3) % 7)
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

		if (this.geoFilter.field && this.geoFilter.lat && this.geoFilter.lon &&
			this.geoFilter.distance.value && this.geoFilter.distance.unit)
		{
			filter = {
				and: [
					{
						geo_distance: {
							distance: this.geoFilter.distance.value + this.geoFilter.distance.unit
						}
					},
					{
						exists: {
							field: this.geoFilter.field
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

	Inquiry.loadAll = function() {
		var d = new Deferred();

		xhr.get('/api/v0/inquiries', {
			handleAs: 'json'
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
							inquiry[key] = response.data[i].definition[key];
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
				handleAs: 'json'
			}).response.then(
				lang.hitch(this, function(response) {
					this.datasetId = response.data.dataset_id;
					this.description = response.data.description;
					this.keep = response.data.keep;
					for (var key in response.data.definition) {
						if (response.data.definition.hasOwnProperty(key)) {
							this[key] = response.data.definition[key];
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
		for (var key in this) {
			if (this.hasOwnProperty(key) && key.indexOf('Filter') !== -1) {
				definition[key] = this[key];
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
				headers: { 'Content-Type': 'application/json' }
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
				headers: { 'Content-Type': 'application/json' }
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

	Inquiry.prototype.toString = function() {
		return this.id;
	};

	return Inquiry;
});
