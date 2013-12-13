class ESStorage

	def initialize
		@es = Elasticsearch::Client.new({
			log: false,
			host: APP_CONFIG["Elasticsearch"]["hostname"],
			port: APP_CONFIG["Elasticsearch"]["port"]
		})
	end

	def search_dataset(dataset, params)
		@es.search({
			index: dataset.es_index,
			type: dataset.es_mapping,
			body: params
		})
	end

	def store_item_in_dataset(item, dataset)
		@es.index({
			index: dataset.es_index,
			type: dataset.es_mapping,
			body: item
		})
	end

end
