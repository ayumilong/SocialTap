module Import
module Worker

class GnipWorker < BaseWorker

	def startup
		super
		# Start connection thread
	end

private

	def start_import(import_op)
		# Add rule to Gnip
	end

	def imports_in_progress

	end

	def stop_import!(op_id)
		# Remove rule from Gnip
	end

end

end
end
