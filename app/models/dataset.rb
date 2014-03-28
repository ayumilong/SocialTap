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

	# @!attribute es_type
	#   Elasticsearch type to use for this dataset's documents.
	#   @return [String]
	attr_readonly :es_type
	validates :es_type, { presence: true }

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
		self.es_type ||= "data"
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

	# Remove this dataset's documents from Elasticsearch by deleting its index.
	def delete_data!
		self.connect_to_es
		@es.indices.delete({ index: self.es_index })
	end

	# Run a query against this dataset.
	# @param [Hash] query The Elasticsearch query to run.
	# @return [Hash] The query results.
	def search(query = { query: { match_all: true }})
		self.connect_to_es
		@es.search({ index: self.es_index, type: self.es_mapping, body: query })
	end

	# === Data import ===

	# @return [Boolean] True if there are any import operations in progress for this dataset.
	#   False if there's not.
	def import_in_progress?
		self.import_operations.select { |op| op.in_progress? } .count > 0
	end

	# @return [ImportOperation] The import operation that is in progress for this dataset.
	def current_import_operation
		self.import_operations.select { |op| op.in_progress? } .first
	end

	# @return [ImportOperation] The last import operation started for this dataset.
	def last_import_operation
		self.import_operations.sort_by(&:time_started).reverse.first
	end

	# Start an import into this dataset.
	# @param [String] source_type The type of source to import from.
	# @param [Hash] source_spec The specification for the source.
	def start_import(source_type, source_spec)
		return false if import_in_progress?

		import_op = ImportOperation.create({
			dataset: self,
			source_type: source_type,
			source_spec: source_spec
		})
		import_op.enqueue
	end

	# Stop any ongoing import operations for this dataset.
	def stop_imports!
		import_operations.select { |op| op.in_progress? } .map(&:cancel!)
	end

end
