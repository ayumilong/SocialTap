require "#{File.expand_path(File.dirname(__FILE__))}/../../config/environment"

queue = MessageQueue.new('socialtap.reports')

puts Process.pid
puts "Connected"

queue.subscribe do |report_id|

	puts "Generating report #{report_id}"
	report = Report.find_by_id(report_id.to_i)

	# If the report doesn't exist, it must have been cancelled
	# before this job was dequeued.
	if report.nil?
		puts "Report does not exist"
		return
	end

	report.status = 'Generating'
	report.worker_pid = Process.pid
	report.save

	Signal.trap('HUP') {
		report.cancel_generation
	}

	begin
		success = report.generate

		# If the report was deleted, skip updating its status
		if !success
			next
		end

	rescue
		report.status = 'Failed'
	end

	report.status = 'Ready' unless report.status == 'Failed'
	report.worker_pid = nil
	report.save

end

queue.close
