require 'elasticsearch'

namespace :es do

	desc "List all indices and types (and the number of documents in each) in Elasticsearch"
	task :list => :environment do

		get_indices.each do |index|
			puts "#{index[:name]} (#{index[:num_docs]} total docs)"
			puts "Types:"
			index[:types].each do |type|
				puts "   #{type[:name]} (#{type[:num_docs]} docs)"
			end
			puts ""
		end

	end

	namespace :delete do

		desc "Delete an index (and its documents) from Elasticsearch"
		task :index, [:index] => :environment do |t, args|
			if args[:index].nil?
				puts "No index specified"
				exit
			end
			client = connect_to_es
			client.indices.delete({ index: args[:index] })
		end

		desc "Delete a type (and its documents) from Elasticsearch"
		task :type, [:index, :type] => :environment do |t, args|
			if args[:index].nil?
				puts "No index specified"
				exit
			end
			if args[:type].nil?
				puts "No type specified"
				exit
			end
			client = connect_to_es
			client.indices.delete_mapping({ index: args[:index], type: args[:type] })
		end
	end

end

def connect_to_es
	Elasticsearch::Client.new({
		log: false,
		host: APP_CONFIG["Elasticsearch"]["hostname"],
		port: APP_CONFIG["Elasticsearch"]["port"]
	})
end

def get_indices
	client = connect_to_es

	status = client.indices.status
	all_mappings = client.indices.get_mapping
	indices = status['indices'].keys.map do |index|
		index_data = {
			name: index,
			num_docs: status['indices'][index]['docs']['num_docs'],
			types: []
		}

		if all_mappings[index]
			index_data[:types] = all_mappings[index]['mappings'].keys.map do |mapping|
				{
					name: mapping,
					num_docs: client.count({ index: index, type: mapping })['count']
				}
			end
		end

		index_data
	end

	indices
end
