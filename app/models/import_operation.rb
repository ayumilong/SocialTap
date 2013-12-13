class ImportOperation < ActiveRecord::Base

	belongs_to :dataset

	after_initialize :set_defaults
	def set_defaults
		self.items_imported ||= 0
	end

	# Do not save if there is already an import operation for this dataset in progress
	before_save :prevent_duplicates
	def prevent_duplicates
		ops = ImportOperation.find_all_by_dataset_id(self.dataset_id).to_a
		ops.select { |op| op != self && op.in_progress? } .empty?
	end

	after_create :begin_import
	def begin_import
		self.time_started = Time.zone.now
		self.save
		puts "Begin import #{self.id}!"
		dataset.begin_import(self)
	end

	def in_progress?
		self.time_stopped.nil?
	end

	def fail!(msg = "Unknown error")
		self.error_message = msg
		self.time_stopped = Time.zone.now
		self.save
	end

	def failed?
		!self.error_message.nil?
	end

	def stop!
		self.time_stopped = Time.zone.now
		self.save
	end

	def restart
		copy = ImportOperation.new(dataset: self.dataset)
		copy.save
	end

end
