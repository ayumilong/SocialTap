require 'elasticsearch'

class Inquiry < ActiveRecord::Base
  belongs_to :user
  belongs_to :dataset

  after_initialize :elasticsearch_connect

  def elasticsearch_connect
    @es = Elasticsearch::Client.new log: false,
      host: APP_CONFIG['Elasticsearch']['hostname'],
      port: APP_CONFIG['Elasticsearch']['port']
  end

  def search
    @es.search index: self.dataset.index, body: self.query
  end

  def query
    {
      query: {
        match: {
          body: { query: self.query_text }
        }
      }
    }
    #{ query: { match_all: { } } }
  end
end
