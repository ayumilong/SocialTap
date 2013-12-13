require Rails.root.join('lib', 'gnip_stream.rb')
require 'json'
require 'thread'

client = GnipStream::Client.new({
	:url => APP_CONFIG['Gnip']['powertrack_stream_url'],
	:username => APP_CONFIG['Gnip']['username'],
	:password => APP_CONFIG['Gnip']['password']
})

puts "[#{DateTime.now}] Started Gnip stream, pid = #{Process.pid}"

activity_queue = Queue.new
stream_stopped = false

consumer = Thread.new do

	es = ESStorage.new
	activities_log = File.open(Rails.root.join('log', 'gnip_activities.log'), 'a:ascii-8bit')

	until stream_stopped && activity_queue.empty? do

		activity_string = activity_queue.pop(true) rescue nil
		if activity_string

			activities_log.puts activity_string

			begin
				activity = JSON.parse(activity_string)
			rescue
				$stderr.puts "[#{DateTime.now}] Received invalid activity"
				$stderr.puts activity_string
				next
			end

			# Determine which datasets the activity belongs to and store
			# it in Elasticsearch
			activity["gnip"]["matching_rules"].each do |rule|
				if !rule["tag"].nil? && (match = rule["tag"].match(/^socialtap:dataset:(\d+)$/))
					dataset = Dataset.find_by_id(match.captures[0])
					io = dataset.import_operations.select { |io| io.in_progress? } .first
					if !io.nil?
						begin
							es.store_item_in_dataset(activity, dataset)
						rescue
							$stderr.puts "[#{DateTime.now}] Failed to save activity #{activity[:id]} to Elasticsearch"
						end
					end
				end
			end
		else
			sleep 0.1
		end

	end

	activities_log.close

	# Mark all current Gnip import operations as stopped
	gnip_imports = ImportOperation.find_all_by_time_stopped(nil).select { |io| io.dataset is_a? GnipDataset }
	gnip_imports.each do |io|
		io.time_stopped = Time.zone.now
		io.error_message = "Gnip index-powertrack import stopped"
		io.save
	end

end

client.on_activity do |activity|
	activity_queue.push(activity)
end

# exit on HUP
Signal.trap('HUP') do
	puts "[#{DateTime.now}] Process #{Process.pid} received HUP, stopping stream, processing #{activity_queue.length} queued activities..."
	client.disconnect
	stream_stopped = true
	consumer.join()
	puts "[#{DateTime.now}] Process #{Process.pid} shutting down."
	exit
end

client.connect
