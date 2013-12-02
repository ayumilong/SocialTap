class ESStorage

	def initialize
		@es = Elasticsearch::Client.new({
			log: false,
			host: APP_CONFIG['Elasticsearch']['hostname'],
			port: APP_CONFIG['Elasticsearch']['port']
		})
	end

	def search_dataset(dataset, params)
		# TODO: Mix dataset ID in to params
		@es.search({
			index: dataset.es_index,
			type: dataset.es_mapping,
			body: params
		})
	end

	def store_activity_in_dataset(activity, dataset)
		@es.update({
			index: dataset.es_index,
			type: dataset.es_mapping,
			id: activity['id'],
			body: {
				script: "if (ctx._source.socialtap.datasets.contains(id)) { ctx.op = \"none\" } else { ctx._source.socialtap.datasets += id }",
				params: {
					id: dataset.id
				},
				upsert: {
					activity: activity,
					socialtap: {
						datasets: [ dataset.id ]
					}
				}
			}
		})
	end

end
