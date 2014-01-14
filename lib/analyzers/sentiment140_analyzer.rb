#!/usr/bin/rails runner

require './lib/analysis'
require './lib/sentiment140'

### SocialTap Analysis Framework Options ###
# The class(es) defined by this module
ANALYZER_CLASSES = ["OpenClemson::Sentiment140"]

# analyzer for sentiment140.com sentiment tagging
BULK_SENTIMENT_QTY = 2000

module OpenClemson
  class Sentiment140 < SocialTap::Analyzer

    def initialize
      @s140_client = Sentiment140::QueryAPI.new APP_CONFIG['Sentiment140']['app_id']
      super
    end

    def run
      # main loop for this process
      while @running
        # check communication queue for new documents
          # put new documents in the wait list
        # check queue size - if BULK_SENTIMENT_QTY is reached 
          # analyze all waiting documents
      end
    end

    def analyze documents
      # collect query data for Sentiment140
      # for each document,
        # build Sentiment140 query data
      # send query off to Sentiment140
      # convert results from JSON
      # for each result, 
        # build results for this analyzer
        # store by Elasticsearch document id
      # store document analysis data by calling store_output
    end

  end
end