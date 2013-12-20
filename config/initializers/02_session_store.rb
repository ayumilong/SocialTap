# Be sure to restart your server when you modify this file.

# Add sessions back (rails-api removes them), for a fitter, happier OmniAuth.
SocialTap::Application.config.session_store :cookie_store, key: '_social_tap_session'
# SocialTap::Application.config.middleware.use Rack::Session::Cookie
