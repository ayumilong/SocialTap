require 'pathname'

class Dataset < ActiveRecord::Base
  has_and_belongs_to_many :users
  has_and_belongs_to_many :viz
  has_many :inquiries
  has_many :import_operations, dependent: :destroy
  has_many :data_sources, through: :import_operations

  validates :name, presence: true, length: { minimum: 3 }
  validates :es_index, presence: true, length: { minimum: 5 }
  validates :es_mapping, presence: true, length: { minimum: 5 }

  after_initialize :set_es_defaults

  def set_es_defaults
    self.es_index ||= APP_CONFIG['Elasticsearch']['default_index']
    self.es_mapping ||= 'activity'
  end

end
