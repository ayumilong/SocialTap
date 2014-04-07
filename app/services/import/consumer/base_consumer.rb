module Import
module Consumer

class BaseConsumer

	# Maximum size of doc queue before it is flushed to Elasticsearch.
	MAX_DOC_QUEUE_SIZE = 5000

	# @param [String] index The Elasticsearch index to store documents in.
	# @param [String] type The Elasticsearch type to use for the stored documents.
	def initialize(index, type)
		@index = index
		@type = type

		@doc_queue = Queue.new
		@worker_threads = Array.new
	end

	# Queue a document to be stored in Elasticsearch
	# @param [Hash] doc The document to be stored.
	def consume_doc(doc)
		@doc_queue.push(doc)

		flush if @doc_queue.length >= MAX_DOC_QUEUE_SIZE
	end

	# Send all documents in the queue to Elasticsearch.
	def flush

		return if @doc_queue.empty?

		queue = @doc_queue
		@doc_queue = Queue.new

		# Run Elasticsearch operations on background threads.
		@worker_threads << Thread.new do

			docs = Array.new
			until queue.empty?
				docs.push(queue.pop)
			end

			# When using the Elasticsearch client, all these request threads would not complete
			# until the import worker process was interrupted. Works fine with cURL though.
			url = "http://#{APP_CONFIG['Elasticsearch']['hostname']}:#{APP_CONFIG['Elasticsearch']['port']}/_bulk"
			curl = Curl::Easy.new(url)
			action = "{\"index\":{\"_index\":\"#{@index}\",\"_type\":\"#{@type}\"}"
			curl.post_body = docs.map { |doc| "#{action}\n#{JSON.fast_generate(doc)}" } .join("\n") << "\n"
			curl.http_post
		end

		purge_completed_workers
	end

	# Block until all worker threads are finished.
	def wait
		@worker_threads.each(&:join)
		purge_completed_workers
	end

private

	# Remove references to worker threads that have already finished.
	def purge_completed_workers
		@worker_threads.keep_if(&:status)
	end

end

end
end
