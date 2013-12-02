require 'curb'

module GnipStream
	class Client

		def initialize(params)
			@username = params[:username]
			@password = params[:password]
			@stream_url = params[:url]

			@curl_handle = nil
		end

		def on_activity(&block)
			@on_activity = block
		end

		def connect
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
		end

		def disconnect
			if !@curl_handle.nil?
				@curl_handle.close
				@curl_handle = nil
			end
		end

	end
end
