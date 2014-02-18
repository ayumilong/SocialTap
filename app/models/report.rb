class Report < ActiveRecord::Base

	belongs_to :user
	belongs_to :inquiry

	accepts_nested_attributes_for :inquiry

	validates_inclusion_of :status, in: ['Pending', 'Generating', 'Ready', 'Failed']

	after_initialize do
		@cancelled = false
	end

	after_commit :queue_job, on: :create

	# Queues a background task to generate this report.
	# Handled by lib/reports/report_worker.rb
	def queue_job
		begin
			mq = MessageQueue.new('socialtap.reports')
			mq.publish(id.to_s)
			mq.close
		rescue
			# Prevent infinite loop of this callback
			if status != 'Failed'
				self.status = 'Failed'
				save
			end
		end
	end

	# Generate the report. This method runs in a background task (lib/reports/report_worker.rb)
	# Return true if generated successfully, false if there is an error or the report is cancelled.
	def generate

		!@cancelled
	end

	def cancel_generation
		@cancelled = true
	end

	before_destroy do
		cancel_generation

		# Notify background task to stop generating report
		Process.kill('HUP', worker_pid) if worker_pid && worker_pid != Process.pid
	end

end
