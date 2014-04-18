require 'curb'

module Gnip
	class StreamClient

		def initialize(params)
			@username = params[:username]
			@password = params[:password]
			@stream_url = "https://stream.gnip.com:443/accounts/#{params[:account_name]}/publishers/twitter/streams/track/Production.json"

			@curl_handle = nil
		end

		def on_activity(&block)
			@on_activity = block
		end

		def connect
			begin
				Curl::Easy.http_get @stream_url do |c|

					@curl_handle = c

					c.http_auth_types = :basic
					c.username = @username
					c.password = @password
					c.encoding = "gzip"
					c.verbose = false

					buffer = String.new
					buffer.encode!('ASCII-8BIT')

					divider = "\r".encode('ASCII-8BIT')

					c.on_body do |data|
						buffer += data

						while (n = buffer.index(divider))

							activity = buffer.slice!(0, n+1)
							activity.strip!

							if activity.empty?
								next
							end

							@on_activity.call(activity)

						end

						data.size
					end
				end
			rescue RuntimeError => e
				# Disconnecting from another thread raises a RuntimeError that can be ignored.
				if connected?
					raise e
				end
			end
		end

		def connected?
			!@curl_handle.nil?
		end

		def disconnect
			if !@curl_handle.nil?
				@curl_handle.close
				@curl_handle = nil
			end
		end

	end
end
