class ImportOperation < ActiveRecord::Base

	belongs_to :data_source
	belongs_to :dataset

	after_initialize :set_defaults
	def set_defaults
		self.activities_imported ||= 0
	end

	# Do not save if there is already an import operation for this dataset and data source in progress
	before_save :prevent_duplicates
	def prevent_duplicates
		ops = ImportOperation.where(dataset_id: self.dataset_id, data_source_id: self.data_source_id).to_a
		ops.select { |op| op != self && op.in_progress? } .count == 0
	end

	after_create :begin_import
	def begin_import

		# For a Gnip data source, creating this operation is enough. The run_gnip_stream background
		# process will pick it up.  However, if that process is not running, mark this operation
		# as stopped with an error.
		puts "Begin import #{self.id}!"

		self.time_started = Time.zone.now

		if self.data_source.is_a? GnipDataSource

			# Check status of Gnip process
			gnip_running = false
			pid_filename = Rails.root.join('tmp', 'pids', 'index-powertrack.pid')
			if File.exists? pid_filename
				begin
					pid_file = File.open(pid_filename, 'r')
					pid = pid_file.read.to_i
					pid_file.close
					status = Process.kill 0, pid
					gnip_running = true
				rescue
				end
			end

			if !gnip_running
				self.time_stopped = Time.zone.now
				self.stop_error_message = "Gnip index-powertrack import not running"
			end


		# For a file data source, start a new background process to import the data.
		elsif self.data_source.is_a? FileDataSource
			self.pid = Process.spawn('rails', 'runner', "ImportOperation.run(#{self.id})", {
				:out => [Rails.root.join('log', "file_import.log"), 'a'],
				:err => [Rails.root.join('log', "file_import.err"), 'a']
			})
			Process.detach(self.pid)
		end

		self.save

	end

	def in_progress?
		self.time_stopped.nil?
	end

	def failed?
		!self.stop_error_message.nil?
	end

	def stop!
		self.time_stopped = Time.zone.now
		self.save
	end

	def restart
		copy = ImportOperation.new(dataset: self.dataset, data_source: self.data_source)
		copy.save
	end

	def self.run(import_id)

		if import_id.nil?
			$stderr.puts "No import operation ID given"
			exit
		end

		import = ImportOperation.find_by_id(import_id)
		if import.nil?
			$stderr.puts "[#{DateTime.now}] Import operation with ID #{import_id} does not exist"
			exit
		end

		mapping = import.data_source.data_mapping

		count = 0

		mapping.on_error do |err|
			$stderr.puts "[#{DateTime.now}] #{import_id}: err"
			$stderr.puts "[#{DateTime.now}] #{import_id}: Failed after importing #{count} activities"
			abort
		end

		es = ESStorage.new

		mapping.process(import.data_source.file.path) do |activity|
			es.store_activity_in_dataset(activity, import.dataset)
			count += 1
		end

		puts "[#{DateTime.now}] #{import_id}: Imported #{count} activities"

		import.time_stopped = DateTime.now
		import.save

	end

end
