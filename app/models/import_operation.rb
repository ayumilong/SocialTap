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
		validator_class = Object.const_get("#{source_type.capitalize}SourceValidator")
		source_spec_errors = validator_class.new(io.source_spec).validate
		source_spec_errors.each do |field, field_errors|
			if field_errors.is_a? Array
				field_errors.each do |err|
					io.errors.add("source_spec.#{field}", err)
				end
			elsif field_errors.is_a? String
				io.errors.add("source_spec.#{field}", field_errors)
			end
		end
	end

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
