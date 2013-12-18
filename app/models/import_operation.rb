class ImportOperation < ActiveRecord::Base

	belongs_to :dataset

	def in_progress
		self.time_stopped.nil?
	end

	def failed
		!self.error_message.nil?
	end

end
