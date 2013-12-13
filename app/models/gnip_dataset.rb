require "gnip-rule"

class GnipDataset < Dataset

  alias_attribute :rule_value, :source

  # Ensure that the given value is valid for a Gnip rule
  # http://support.gnip.com/customer/portal/articles/600659-powertrack-generic#Rules
  validate :validate_rule
  def validate_rule
    rule = GnipRule::Rule.new(rule_value, gnip_tag)
    if !rule.valid?
      errors[:source] << (rule_value + " is not a valid Gnip rule")
    end
  end

  def gnip_tag
    self.id && "socialtap:dataset:#{self.id}"
  end

  # Keep this model in sync with Gnip using the Gnip rules API
  def connect_to_gnip
    @gnip_rule_client ||= GnipRule::Client.new(
      APP_CONFIG["Gnip"]["powertrack_rules_url"],
      APP_CONFIG["Gnip"]["username"],
      APP_CONFIG["Gnip"]["password"])
  end

  def save_rule_to_gnip
    begin
      connect_to_gnip
      @gnip_rule_client.add(GnipRule::Rule.new(rule_value, gnip_tag))
    rescue
      # Raise exception to cancel DB transaction
      raise "Failed to save rule to Gnip"
    end
  end

  def remove_rule_from_gnip
    begin
      connect_to_gnip
      @gnip_rule_client.delete(GnipRule::Rule.new(rule_value, gnip_tag))
    rescue
      # Cancel DB transaction
      false
    end
  end

  def begin_import(io)
    # Check status of index-powertrack process
    pid_filename = Rails.root.join("tmp", "pids", "index-powertrack.pid")
    begin
      io.pid = File.read(pid_filename).to_i
      Process.kill 0, io.pid
      self.save_rule_to_gnip
    rescue
      io.time_stopped = Time.zone.now
      io.error_message = "Gnip index-powertrack import not running"
    end
    io.save
  end

  def end_import(io)
    self.remove_rule_from_gnip
  end

end
