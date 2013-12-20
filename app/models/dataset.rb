class Dataset < ActiveRecord::Base
  has_and_belongs_to_many :users
  has_and_belongs_to_many :viz
  has_many :inquiries
  has_many :import_operations, dependent: :destroy

  validates :name, presence: true
  validates :source, presence: true

  after_create :create_elasticsearch_index

  # Immediately start importing data after creation
  after_create :start_import

  before_destroy :stop_import, :if => :import_in_progress

  before_destroy :delete_from_elasticsearch

  def es_index
    self.id && "socialtap:dataset:#{self.id}"
  end

  def es_mapping
    "data"
  end

  def connect_to_es
    @es ||= Elasticsearch::Client.new({
      log: false,
      host: APP_CONFIG["Elasticsearch"]["hostname"],
      port: APP_CONFIG["Elasticsearch"]["port"]
    })
  end

  def create_elasticsearch_index
    self.connect_to_es
    @es.indices.create index: self.es_index
  end

  def import_in_progress
    !self.import_operations.select { |io| io.in_progress } .empty?
  end

  def current_import_operation
    self.import_operations.select { |io| io.in_progress } .first
  end

  def last_import_operation
    self.import_operations.sort_by(&:time_started).reverse.first
  end

  def start_import
    raise NotImplementedError
  end

  def stop_import
    raise NotImplementedError
  end

  def delete_from_elasticsearch
    self.connect_to_es
    @es.indices.delete index: self.es_index
  end

  def search(params)
   self.connect_to_es
   @es.search({
     index: self.es_index,
     type: self.es_mapping,
     body: params
   })
 end

end
