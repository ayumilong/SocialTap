module Import
module Worker

class StreamStopException < ::StandardError
end

class TwitterWorker < BaseWorker

	def initialize
		super
		@stopped_queue = Queue.new
	end

private

	def start_import(import_op)

		@current_import_id = import_op.id

		log "Importing from Twitter: track = '#{import_op.source_spec['track'].join(', ')}'"

		consumer = ::Import::Consumer::BaseConsumer.new(import_op.dataset.es_index, "import_#{import_op.id}")

		# Instantiate the appropriate type of format converter
		converter = nil
		if import_op.convert?
			converter_type = "#{import_op.from_format}_to_#{import_op.to_format}".camelize
			converter = Object.const_get("::Import::Converter::#{converter_type}").new
		end

		twitter_account = import_op.started_by.connected_accounts.select { |acct| acct.provider == 'twitter' } .first
		if twitter_account.nil?
			import_stopped(import_op, "No Twitter account connected")
			@current_import_id = nil
			return
		end

		error = nil
		@stream_thread = Thread.new do
			begin
				client = ::Twitter::Streaming::Client.new do |config|
					config.consumer_key = APP_CONFIG['Twitter']['consumer_key']
					config.consumer_secret = APP_CONFIG['Twitter']['consumer_secret']
					config.access_token = twitter_account.token
					config.access_token_secret = twitter_account.secret
				end

				client.filter(:track => import_op.source_spec['track'].join(',')) do |object|
					if object.is_a?(::Twitter::Tweet)

						doc = object.to_h

						unless converter.nil?
							doc = converter.convert(doc.deep_stringify_keys)
						end

						consumer.consume_doc(doc)

					elsif object.is_a?(::Twitter::StallWarning)
						log "Stall warning!"
					end
				end
			rescue StreamStopException
				log "Stream shutdown"
			rescue StandardError => e
				error = e.message
				log "Caught exception: #{e.message}"
				puts e.backtrace.join("\n")
			end
		end

		@stream_thread.join

		log "Flushing consumer"
		consumer.flush
		consumer.wait

		import_stopped(import_op, error)
		log "Done"

		# Notify that the import was stopped
		@stopped_queue.push(true)

		@current_import_id = nil
	end

	def imports_in_progress
		@current_import_id.nil? ? [] : [ @current_import_id ]
	end

	def stop_import!(op_id)
		if op_id == @current_import_id && @stream_thread.alive?

			# Force stream client to disconnect
			@stream_thread.raise(StreamStopException.new("Stop!"))

			# Block until worker thread stops importing
			@stopped_queue.pop
		end
	end


end

end
end
