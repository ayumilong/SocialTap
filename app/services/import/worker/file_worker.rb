module Import
module Worker

class FileWorker < BaseWorker

	def startup
		super
		@stop_queue = Queue.new
	end

private

	def start_import(import_op)
		@stopped = false
		do_import(import_op)
	end

	def imports_in_progress
		@current_import_id.nil? ? [] : [ @current_import_id ]
	end

	def stop_import!(op_id)
		@stopped = true
		# Block until worker thread stops importing
		@stop_import.pop
	end

	# Execute an import operation. Does not return until the import is complete.
	# @param [ImportOperation] The import operation to execute.
	def do_import(import_op)
		@current_import_id = import_op.id

		# TODO: More debug logs
		source = ::Import::Source::FileSource.new(import_op.source_spec)

		consumer = ::Import::Consumer::BaseConsumer.new(import_op.dataset.es_index, import_op.dataset.es_type)

		# Import docs from source until stopped or finished.
		begin
			source.each_doc do |doc|
				consumer.consume_doc(doc)
				break if @stopped
			end
			consumer.flush
			consumer.wait
			import_stopped(import_op)
		rescue StandardError => e
			import_stopped(import_op, e.message)
		end

		# Notify thread that requested the stop that the operation is stopped.
		@stop_queue.push(true) if @stopped

		@current_import_id = nil
	end

end

end
end
