#!/usr/bin/env ruby

require 'socket'

module Import
module Worker

class BaseWorker

	def initialize
		@shutdown_queue = Queue.new
	end

	# Type of imports handled by this worker
	def import_type
		# Assumes worker classes are named "Import::Worker::#{import_type}Worker"
		self.class.name.downcase.split("::").last.slice(0..-7)
	end

	# Startup the worker and start running queued import operations.
	def startup
		log "Starting up"

		@mq_connection = Bunny.new(APP_CONFIG['rabbitmq'])
		@mq_connection.start

		subscribe_to_stop_messages
		subscribe_to_start_messages

		# Block until a shutdown signal is received.
		@shutdown_queue.pop
	end

	# Shutdown the worker. Stop any imports in progress.
	def shutdown
		log "Shutting down..."
		@listener_thread.kill
		imports_in_progress.each do |op_id|
			stop_import!(op_id)
			import_stopped(ImportOperation.find_by_id(op_id), "Worker shut down")
		end
		log "All imports stopped"
		@worker_thread.kill
		@mq_connection.stop

		@shutdown_queue.push(true)
	end

private

	# Output with timestamp.
	def log(message)
		puts "[#{DateTime.now}] #{message}"
	end

	# Set an operation's time stopped and clear worker information.
	# Called by Base after a stop_import! command returns
	# Subclasses should only have to call this when an import either fails or succesfully
	# imports all documents from the source.
	# @param [ImportOperation] import_op The import that was stopped.
	# @param [String] error_message Error message if the import failed.
	def import_stopped(import_op, error_message = nil)
		import_op.time_stopped = Time.zone.now
		import_op.error_message = error_message unless error_message.nil?
		import_op.worker_hostname = nil
		import_op.worker_pid = nil
		import_op.save
	end

	# Start an import operation with this worker process.
	# @param [ImportOperation]
	def start_import(import_op)
		raise NotImplementedError
	end

	# @return [Boolean] True if this worker is handling the specified import.
	def handling_import?(op_id)
		imports_in_progress.include?(op_id)
	end

	# Get IDs of all import operations currently being handled by this worker.
	# @return [Array]
	def imports_in_progress
		raise NotImplementedError
	end

	# Stop a specific import. This will only be called if this worker is handling the import.
	# This should block until the import is stopped.
	# @param [Fixnum] op_id The ID of the import to stop.
	def stop_import!(op_id)
		raise NotImplementedError
	end

	def subscribe_to_start_messages
		@start_channel = @mq_connection.create_channel
		@worker_thread = Thread.new do
			@start_message_queue = @start_channel.queue("socialtap.import.start.#{import_type}", { auto_delete: false, durable: true})
			@start_message_queue.subscribe({ block: true }) do |delivery_info, properties, payload|
				op_id = payload.to_i
				log "Received order to run import operation: #{op_id}"

				import_op = ImportOperation.find_by_id(op_id)

				if import_op.nil?
					log "Unable to find import operation with ID: #{op_id}"
					next
				end

				if import_op.status != :pending
					log "Import operation is already running"
					next
				end

				import_op.time_started = Time.zone.now
				import_op.worker_hostname = Socket.gethostname
				import_op.worker_pid = Process.pid
				import_op.save

				begin
					start_import(import_op)
				rescue StandardError => e
					log "Failed to start import #{op_id}"
					log e.message
					log e.backtrace.join("\n")
					import_stopped(import_op, e.message)
				end
			end
		end
	end

	def subscribe_to_stop_messages
		@stop_channel = @mq_connection.create_channel
		@listener_thread = Thread.new do
			@stop_message_queue = @stop_channel.queue("", { auto_delete: true, block: true })
			@stop_exchange = @stop_channel.fanout("socialtap.import.stop")
			@stop_message_queue.bind(@stop_exchange)
			@stop_message_queue.subscribe({ block: true }) do |delivery_info, metadata, payload|
				op_id = payload.to_i
				log "Received order to stop import op: #{op_id}"
				if handling_import?(op_id)
					log "Stopping import #{op_id}"
					import_op = ImportOperation.find_by_id(op_id)
					import_op.aborted = true
					import_op.save
					stop_import!(op_id)
					import_stopped(import_op)
				else
					log "Ignoring"
				end
			end
		end
	end

end

end
end
