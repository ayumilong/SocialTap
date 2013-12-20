# Load the configuration parameters for the application
# They can be accessed by using APP_CONFIG['section_name']['key_name]

# Process /config/SocialTap.yml as a YAML file
config_file_path = Rails.root.join('config', 'SocialTap.yml')
config_file = YAML.load_file(config_file_path)

# Pull out the config parameters for the current environment
APP_CONFIG = config_file[Rails.env]
