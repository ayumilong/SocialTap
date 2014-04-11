class Dataset < ActiveRecord::Base
	include EnforceReadonlyAttributes

	# @!attribute name
	#   The name of the dataset
	#   @return [String]
	validates :name, { presence: true, uniqueness: { case_sensitive: false } }

	# @!attribute description
	#   Description of dataset
	#   @return [String]

	# @!attribute es_index
	#   Elasticsearch index containing this dataset's documents.
	#   @return [String]
	attr_readonly :es_index
	validates :es_index, { presence: true, uniqueness: { case_sensitive: false } }

	# @!attribute inquiries
	#   Saved inquiries targeting this dataset.
	#   @return [Array]
	has_many :inquiries, dependent: :destroy

	# @!attribute import_operations
	#   Data imports into this dataset.
	#   @return [Array]
	has_many :import_operations, dependent: :destroy

	# @!attribute reports
	#   Reports generated from this dataset.
	#   @return [Array]
	has_many :reports, dependent: :destroy

	# @!attribute users
	#   Users with access to this dataset.
	#   @return [Array]
	has_and_belongs_to_many :users

	# Default Elasticsearch index and type.
	after_initialize do
		if es_index.nil?
			if name? # Generate default Elasticsearch index base on name.
				self.es_index = "socialtap:#{name.parameterize}"
			else # Generate random unique Elasticsearch index.
				begin
					self.es_index = "socialtap:#{SecureRandom.uuid}"
				end while Dataset.find_by_es_index(es_index)
			end
		end
	end

	after_commit :ensure_es_index_exists, on: :create

	# Establish a connection to Elasticsearch.
	def connect_to_es
		@es ||= Elasticsearch::Client.new({
			log: false,
			host: APP_CONFIG["Elasticsearch"]["hostname"],
			port: APP_CONFIG["Elasticsearch"]["port"]
		})
	end

	# Create this dataset's Elasticsearch index if it does not already exist.
	def ensure_es_index_exists
		self.connect_to_es
		@es.indices.create({ index: self.es_index }) unless @es.indices.exists({ index: self.es_index })
	end

	# Remove all documents in this dataset from Elasticsearch.
	def delete_data!
		self.connect_to_es

		# The fastest way to do this is delete and recreate the index.
		@es.indices.delete({ index: self.es_index })
		@es.indices.create({ index: self.es_index })
		@es.indices.refresh({ index: self.es_index })
	end

	# Run a query against this dataset.
	# @param [Hash] query The Elasticsearch query to run.
	# @return [Hash] The response from Elasticsearch.
	def search(query = { query: { match_all: true }})
		self.connect_to_es
		@es.search({ index: self.es_index, body: query })
	end

end
