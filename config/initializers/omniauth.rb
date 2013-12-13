OmniAuth.config.logger = Rails.logger

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :developer unless Rails.env.production?
  provider :twitter, 'TWITTER_KEY', 'TWITTER_SECRET'
  provider :identity, :fields => [:email], :model => AuthIdentity
end