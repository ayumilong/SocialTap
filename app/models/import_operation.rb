class ImportOperation < ActiveRecord::Base
	include EnforceReadonlyAttributes

	# @!attribute dataset
	#   Dataset this operation is importing data into.
	#   @return [Dataset]
	attr_readonly :dataset_id
	belongs_to :dataset

	# @!attribute source_type
	#   Type of source imported from in this operation.
	#   @return [String]
	attr_readonly :source_type
	validates :source_type, { presence: true }
	def source_type=(source_type)
		super(source_type.downcase)
	end

	# @!attribute source_spec
	#   Specification of source. Format depends on source type.
	#   @return [Hash]
	attr_readonly :source_spec
	serialize :source_spec, JSON
	validates :source_spec, { presence: true }
	validate do |io|

		# Do validations specific to this import's source type
		validator_class = Object.const_get("#{source_type.capitalize}ImportValidator")
		validator_class.new(io).validate

		# Check that the requested conversion is available
		if io.convert?
			match = false
			Import::Converter.available_conversions.each do |conversion|
				if conversion[:from] == io.from_format && conversion[:to] == io.to_format
					match = true
					break
				end
			end
			if !match
				io.errors.add("to_format", "No conversion from #{io.from_format.titleize} to #{io.to_format.titleize} available")
			end
		end
	end

	# Whether or not to convert to a different format on imoprt.
	# @return [Boolean]
	def convert?
		from_format? && to_format?
	end
	alias_method :convert, :convert?

	# @!attribute from_format
	#   The format of documents in the original source.
	#   @return [String]

	# @!attribute to_format
	#   The format to convert documents to when importing into Elasticsearch.
	#   @return [String]

	# @!attribute time_started
	#   The time this operation was started.
	#   @return [ActiveSupport::TimeWithZone]

	# @!attribute time_stopped
	#   The time this operation was stopped or nil if it is ongoing.
	#   @return [ActiveSupport::TimeWithZone]

	# @!attribute aborted
	#   Whether this operation was aborted by the user (true) or ran to completion (false).
	#   @return [Boolean]

	# @!attribute error_message
	#   Error message if this operation failed or was cancelled. Nil if this operation
	#   finished successfully or is ongoing.
	#   @return [String]

	# @!attribute worker_hostname
	#   Host name of the machine this operation's worker process is running on.
	#   @return [String]

	# @!attribute worker_pid
	#   PID of the this operation's worker process.
	#   @return [Integer]

	# Establish a connection to the RabbitMQ server.
	def connect_to_mq
		@mq_connection = Bunny.new(APP_CONFIG['rabbitmq'])
		@mq_connection.start
	end

	# Notify a worker process to handle this operation.
	def enqueue
		if persisted?
			connect_to_mq
			channel = @mq_connection.create_channel
			start_queue = channel.queue("socialtap.import.start.#{source_type}", { auto_delete: false, durable: true })
			start_queue.publish(id.to_s, { persistent: true })
		end
	end

	# @return [Symbol] Status of this operation.
	def status
		if time_started.nil?
			:pending
		else
			if aborted?
				:aborted
			elsif in_progress?
				:in_progress
			elsif failed?
				:failed
			else
				:completed
			end
		end
	end

	# @return [Boolean] True if this operation is ongoing, false if it has stopped for any reason.
	def in_progress?
		time_stopped.nil?
	end

	# @return [Boolean] True if this operation failed or was cancelled, false if it completed
	#   successfully or is ongoing.
	def failed?
		!error_message.nil?
	end

	# Notify this operation's worker process to stop importing its source.
	def cancel!
		if id?
			connect_to_mq
			channel = @mq_connection.create_channel
			stop_exchange = channel.fanout("socialtap.import.stop")
			stop_exchange.publish(id.to_s)
		end
	end

end
