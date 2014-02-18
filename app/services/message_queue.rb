class MessageQueue

	def initialize(name=nil)
		raise StandardError, "Message queue name cannot be nil" if name.nil?

		@name = name

		@connection = Bunny.new(APP_CONFIG['rabbitmq'])
		@connection.start

		@channel = @connection.create_channel
		@queue = @channel.queue(@name, {cauto_delete: false, durable: true })
	end

	def subscribe
		@queue.subscribe({ ack: true, block: true }) do |delivery_info, properties, payload|
			begin
				# Yield payload to be processed
				yield payload
				# Acknowledge the message if the processing block succeeds
				@channel.ack(delivery_info.delivery_tag)
			rescue
				# If the processing block fails, reject the message
				@channel.nack(delivery_info.delivery_tag)
			end
		end
	end

	def publish(message)
		@queue.publish(message, { persistent: true })
	end

	def close
		@connection.stop
	end

end
