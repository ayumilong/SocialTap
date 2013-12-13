class Dataset < ActiveRecord::Base
  has_and_belongs_to_many :users
  has_and_belongs_to_many :viz
  has_many :inquiries
  has_many :import_operations, dependent: :destroy

  validates :name, presence: true
  validates :source, presence: true

  def es_index
    self.id && "socialtap:dataset:#{self.id}"
  end

  def es_mapping
    "data"
  end

  def start_import
    io = ImportOperation.new(dataset: self)
    io.save
  end

  def stop_import
    io = self.import_operations.select { |io| io.in_progress? } .first
    io && io.stop!
  end

  # Start background process to import data from source
  def begin_import(io)
    raise NotImplementedError
  end

  def end_import(io)
    raise NotImplementedError
  end

end
