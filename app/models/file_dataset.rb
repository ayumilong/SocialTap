class FileDataset < Dataset

  has_one :data_mapping, dependent: :destroy

  accepts_nested_attributes_for :data_mapping

  def path
    source && File.join(APP_CONFIG["data_files"]["import_directory"], source)
  end

  validate :validate_file_existence
  def validate_file_existence
    begin
      f = File.open(path, "r")
      f.close
    rescue
      errors[:source] << ("Unable to open " + path)
    end
  end

  def begin_import(io)
    io.pid = Process.spawn("rails", "runner", "FileDataset.run_import(#{io.id})", {
      :out => [Rails.root.join("log", "file_import.log"), "a"],
      :err => [Rails.root.join("log", "file_import.err"), "a"]
    })
    Process.detach(io.pid)
    io.save
  end

  def end_import(io)
    Process.kill("INT", io.pid)
  end

  def self.run_import(import_id)
    if import_id.nil?
      $stderr.puts "No import operation ID given"
      return false
    end

    import = ImportOperation.find_by_id(import_id)
    if import.nil?
      $stderr.puts "[#{DateTime.now}] Import operation with ID #{import_id} does not exist"
      return false
    end

    mapping = import.dataset.data_mapping

    mapping.on_error do |err|
      $stderr.puts "[#{DateTime.now}] #{import_id}: err"
      $stderr.puts "[#{DateTime.now}] #{import_id}: Failed after importing #{count} items"
      return false
    end

    es = ESStorage.new

    mapping.process(File.join(APP_CONFIG['data_files']['import_directory'], import.dataset.path)) do |item|
      begin
        es.store_item_in_dataset(item, import.dataset)
      rescue
        import.error_message = "Unable to connect to Elasticsearch"
        import.time_stopped = Time.zone.now
        import.save
        return false
      end
    end

    puts "[#{DateTime.now}] #{import_id}: Imported #{count} items"

    import.time_stopped = Time.zone.now
    import.save

    true
  end

end
