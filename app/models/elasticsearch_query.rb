class ElasticsearchQuery

	# Generate an Elasticsearch query from an inquiry.
	# Returns a hash to be passed to Elasticsearch::Client#search
	def self.from_inquiry(inquiry)

		filters = []

		textFilter = inquiry.definition['textFilter']
		if textFilter['value'] && textFilter['fields'].count > 0
			textValue = textFilter['value'].split(/\s+/);
			if textFilter['fields'].count == 1
				filters.push({ 'terms' => { textFilter['fields'][0] => textValue } })
			else
				orFilter = { 'or' => [] }
				textFilter['fields'].each do |field|
					orFilter['or'].push({ 'terms' => { field => textValue } })
				end
				filters.push(orFilter)
			end
		end

		dateFilter = inquiry.definition['dateFilter']
		if dateFilter['field'] && dateFilter['range']['start'] && dateFilter['range']['end']
			f = {}
			if dateFilter['range']['start']
				f['gte'] = dateFilter['range']['start']
			end
			if dateFilter['range']['end']
				f['lte'] = dateFilter['range']['end']
			end
			filters.push({ dateFilter['field'] => f })
		end

		if dateFilter['field'] && dateFilter['days'].count > 0
			dayFilters = []
			dateFilter['days'].each do |day|
				dayFilters.push({
					'script' => {
						'script' => "((doc['postedTime'].date.millis / 86400000) % 7) == day",
						'params' => {
							'day' => ((day + 3) % 7)
						}
					}
				})
			end
			if dayFilters.count == 1
				filters.push(dayFilters[0])
			else
				filters.push({ 'or' => dayFilters })
			end
		end

		geoFilter = inquiry.definition['geoFilter']
		if geoFilter['field'] && geoFilter['lat'] && geoFilter['lon'] && geoFilter['distance']['value'] && geoFilter['distance']['unit']
			filters.push({
				'and' => [
					{
						'geo_distance' => {
							'distance' => "#{geoFilter['distance']['value']}#{geoFilter['distance']['unit']}"
						},
						'exists' => {
							'field' => geoFilter['field']
						}
					}
				]
			})
		end

		if filters.length == 0
			{
				'query' => {
					'match_all' => {}
				}
			}
		elsif filters.length == 1
			{
				'query' => {
					'filtered' => {
						'query' => {
							'match_all' => {}
						},
						'filter' => filters[0]
					}
				}
			}
		else
			{
				'query' => {
					'filtered' => {
						'query' => {
							'match_all' => {}
						},
						'filter' => {
							'and' => {
								'filters' => filters
							}
						}
					}
				}
			}
		end

	end

end
