module Import
module Worker

class GnipWorker < BaseWorker

	# TODO: Recover from the case where there are SocialTap rules in Gnip
	# when this worker starts. Aha! On startup, query Gnip rules?
	# It'll be all messed up anyway if the former Gnip worker is killed -9
	# because its import operations will be left in the 'in progress' state.
	# Don't know how to handle that.

	# On startup, query rules, create new import operations if necessary.
	# Mark any old import ops as done with an error message stating worker died,
	# stop time not valid.

	def startup
		@activity_queue = Queue.new

		log "Starting Gnip connection"
		@connection_thread = Thread.new do
			@stream = ::Gnip::StreamClient.new({
				username: APP_CONFIG['Gnip']['username'],
				password: APP_CONFIG['Gnip']['password'],
				account_name: APP_CONFIG['Gnip']['account_name']
			})

			@stream.on_activity do |activity|
				@activity_queue.push(activity)
			end

			# Blocks until disconnected
			@stream.connect

			log "Connection thread exiting"
		end

		@consumers = Hash.new

		puts "Starting consumption"
		@consumer_thread = Thread.new do
			while true
				activity_string = @activity_queue.pop
				begin
					activity = JSON.parse(activity_string)

					activity['gnip']['matching_rules'].each do |rule|
						if !rule['tag'].nil? && (match = rule['tag'].match(/^socialtap:import:(\d+)$/))
							op_id = match.captures[0].to_i

							# Once an import is stopped, its consumer is flushed and removed. Ignore
							# any activities from that import's rule that are still in the queue.
							if @consumers[op_id]
								@consumers[op_id].consume_doc(activity)
							end
						end
					end
				rescue ::JSON::ParserError

				end
			end
		end

		# Blocks until a shutdown signal is received.
		super

		# Close Gnip connection
		log "Disconnecting from Gnip stream"
		@stream.disconnect
		if @connection_thread.alive?
			log "Waiting on connection thread"
			@connection_thread.join
			log "Done"
		end

		# Since all imports have already been stopped, the consumer thread is blocking
		# waiting on the activity queue. So it must be killed.
		log "Stopping consumption thread"
		@consumer_thread.kill

		log "Shutdown complete"

	end

private

	def connect_to_gnip_rules
		@gnip_rule_client ||= ::GnipRule::Client.new(
			"https://api.gnip.com:443/accounts/#{APP_CONFIG['Gnip']['account_name']}/publishers/twitter/streams/track/Production/rules.json",
			APP_CONFIG['Gnip']['username'],
			APP_CONFIG['Gnip']['password']
		)
	end

	def start_import(import_op)
		# Add rule to Gnip. Tag with import operation ID.
		log "Start import #{import_op.id} with rule '#{import_op.source_spec['rule']}'"
		connect_to_gnip_rules
		@consumers[import_op.id] = ::Import::Consumer::BaseConsumer.new(import_op.dataset.es_index, import_op.dataset.es_type)
		begin
			@gnip_rule_client.add(::GnipRule::Rule.new(import_op.source_spec['rule'], "socialtap:import:#{import_op.id}"))
			log "Successfully added rule '#{import_op.source_spec['rule']}' to Gnip"
		rescue StandardError => e
			import_stopped(import_op, "Unable to upload rule")
			log "Unable to upload rule for import #{import_op.id}"
			@consumers.delete(import_op.id)
		end
	end

	def imports_in_progress
		@consumers.keys
	end

	def stop_import!(op_id)
		# Remove rule from Gnip
		log "Stop import #{op_id}"
		connect_to_gnip_rules
		import_op = ImportOperation.find_by_id(op_id)
		@gnip_rule_client.delete(::GnipRule::Rule.new(import_op.source_spec['rule'], "socialtap:import:#{import_op.id}"))
		log "Removed rule '#{import_op.source_spec['rule']}' from Gnip"

		# Flush and delete consumer
		log "Flushing consumer"
		@consumers[op_id].flush
		@consumers[op_id].wait
		log "Import #{op_id} stopped"
		@consumers.delete(op_id)
	end

end

end
end
