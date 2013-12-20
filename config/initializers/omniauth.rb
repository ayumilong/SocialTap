# Setup OmniAuth for authentication

OmniAuth.config.logger = Rails.logger

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :developer unless Rails.env.production?
  provider :twitter, APP_CONFIG['Twitter']['consumer_key'], APP_CONFIG['Twitter']['consumer_secret']
  provider :identity, :model => AuthIdentity
end