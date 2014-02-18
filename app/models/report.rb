class Report < ActiveRecord::Base

	belongs_to :user
	belongs_to :inquiry

	validates :user, presence: true
	validates :inquiry, presence: true

	accepts_nested_attributes_for :inquiry

	validates_inclusion_of :status, in: ['Pending', 'Generating', 'Ready', 'Failed']

	after_initialize do
		@cancelled = false
	end

	def output_path
		File.join(APP_CONFIG['reports']['output_directory'], "socialtap_report_#{id}.txt")
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

		query = ElasticsearchQuery.from_inquiry(inquiry)
		page_size = 500

		File.open(output_path, 'w') do |f|
			page_number = 0
			num_docs = 0
			begin

				# Query Elasticsearch for page of results
				result = inquiry.dataset.search(query.merge({
					'from' => page_number * page_size,
					'size' => page_size
				}))

				# Extract original documents from Elasticsearch result
				docs = result['hits']['hits'].map { |hit| hit['_source'] }
				num_docs = docs.count

				# Write documents to file
				docs.each do |doc|
					f.puts doc.to_json
				end

				page_number += 1

			end while num_docs == page_size && !@cancelled
		end

		!@cancelled
	end

	def cancel_generation!
		@cancelled = true
	end

	before_destroy do
		cancel_generation!

		# Notify background task to stop generating report
		Process.kill('HUP', worker_pid) if worker_pid && worker_pid != Process.pid
	end

end
