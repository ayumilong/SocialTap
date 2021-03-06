# Setup OmniAuth for authentication

OmniAuth.config.logger = Rails.logger

OmniAuth.config.on_failure = Proc.new { |env|
	OmniAuth::FailureEndpoint.new(env).redirect_to_failure
}

Rails.application.config.middleware.use OmniAuth::Builder do
	provider :twitter, APP_CONFIG['Twitter']['consumer_key'], APP_CONFIG['Twitter']['consumer_secret']
	provider :identity, :fields => [:email, :name], on_failed_registration: lambda { |env|
		# Instead of redirecting on a failed registration, send a JSON response
		# containing the errors.
		resp = Rack::Response.new
		resp.status = 400
		resp['Content-Type'] = 'application/json'
		resp.write ({ :errors => env['omniauth.identity'].errors.full_messages }.to_json)
		resp.finish
	}
end
