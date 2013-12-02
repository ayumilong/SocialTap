require 'gnip-rule'

class GnipDataSourceRule < ActiveRecord::Base
	belongs_to :gnip_data_source

	attr_readonly :value

	validates :value, uniqueness: true

	# Ensure that the given value is valid for a Gnip rule
	# http://support.gnip.com/customer/portal/articles/600659-powertrack-generic#Rules
	validate :validate_rule
	def validate_rule
		rule = GnipRule::Rule.new(value, tag)
		if !rule.valid?
			errors[:value] << (value + " is not a valid Gnip rule")
		end
	end

	def tag
		if id.nil?
			nil
		else
			"socialtap:data_source:#{id}"
		end
	end

	# Keep this model in sync with Gnip using the Gnip rules API
	def connect_to_gnip
		@gnip_rule_client ||= GnipRule::Client.new(
			APP_CONFIG["Gnip"]["powertrack_rules_url"],
			APP_CONFIG["Gnip"]["username"],
			APP_CONFIG["Gnip"]["password"]
		)
	end

	after_create :save_rule_to_gnip
	def save_rule_to_gnip
		begin
			connect_to_gnip
			@gnip_rule_client.add(GnipRule::Rule.new(value, tag))
		rescue
			# Raise exception to cancel DB transaction
			raise 'Failed to save rule to Gnip'
		end
	end

	before_destroy :remove_rule_from_gnip
	def remove_rule_from_gnip
		begin
			connect_to_gnip
			@gnip_rule_client.delete(GnipRule::Rule.new(value, tag))
		rescue
			# Cancel DB transaction
			false
		end
	end

end
