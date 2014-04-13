module Import
module Worker

class FileWorker < BaseWorker

	def initialize
		super

		@stop_queue = Queue.new
		@stopped_queue = Queue.new
	end

private

	def start_import(import_op)
		# Clear stopped notices before starting import
		until @stopped_queue.empty?
			@stopped_queue.pop
		end
		do_import(import_op)
	end

	def imports_in_progress
		@current_import_id.nil? ? [] : [ @current_import_id ]
	end

	def stop_import!(op_id)
		# Notify worker thread to stop importing.
		@stop_queue.push(true)

		# Block until worker thread stops importing
		@stopped_queue.pop
	end

	# Execute an import operation. Does not return until the import is complete.
	# @param [ImportOperation] The import operation to execute.
	def do_import(import_op)
		@current_import_id = import_op.id

		log "Importing '#{import_op.source_spec['path']}'..."

		consumer = ::Import::Consumer::BaseConsumer.new(import_op.dataset.es_index, "import_#{import_op.id}")

		# Instantiate the appropriate type of format converter
		converter = nil
		if import_op.convert?
			converter_type = "#{import_op.from_format}_to_#{import_op.to_format}".camelize
			converter = Object.const_get("::Import::Converter::#{converter_type}").new
		end

		# Import docs from file until stopped or finished.
		stopped = false
		begin
			File.open(import_op.source_spec['path']).each do |line|
				line.chomp!
				unless line.empty?
					doc = JSON.parse(line)

					unless converter.nil?
						original_doc = doc
						doc = converter.convert(original_doc)

						if import_op.source_spec['preserve_fields']
							doc['socialtap'] = {}
							doc['socialtap']['preserved_fields'] = {}

							import_op.source_spec['preserve_fields'].each do |field_keypath|

								# Extract value for the given key path from original document.
								field_value = field_keypath.split('.').inject(original_doc) { |obj, key| obj[key] } rescue nil

								# Set the value for the same keypath under 'socialtap.preserved_fields'
								# in the converted doc
								obj = doc['socialtap']['preserved_fields']
								field_keypath.split('.').slice(0..-2).each do |key|
									if obj[key].nil?
										obj[key] = {}
									end
									obj = obj[key]
								end
								obj[field_keypath.split('.').last] = field_value
							end
						end
					end

					consumer.consume_doc(doc)

					stopped = @stop_queue.pop(true) rescue false
					if stopped
						log "Import stopped"
						break
					end
				end
			end
			log "Flushing consumer"
			consumer.flush
			consumer.wait
			log "Done importing '#{import_op.source_spec['path']}'"
			import_stopped(import_op)
		rescue StandardError => e
			log "Import from '#{import_op.source_spec['path']}' failed: #{e.message}"
			log e.backtrace.join("\n")
			import_stopped(import_op, e.message)
		end

		# Notify thread that requested the stop that the operation is stopped.
		@stopped_queue.push(true) if stopped

		@current_import_id = nil
	end

end

end
end
