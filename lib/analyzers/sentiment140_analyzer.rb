#!/usr/bin/rails runner

require './lib/analysis'
require './lib/sentiment140'

### SocialTap Analysis Framework Options ###
# The class(es) defined by this module

# analyzer for sentiment140.com sentiment tagging

BULK_SENTIMENT_QTY = 2000

module SocialTap
  module Analyzers
    class Sentiment140 < SocialTap::Analyzer

      def initialize
        @s140_client = Sentiment140::QueryAPI.new APP_CONFIG['Sentiment140']['app_id']
        @document_cache = []
        super # thanks for asking
      end

      def step
        sleep 0.5
        puts "this might be useful eventually"
      end

      def new_document delivery_info, properties, payload
        document = JSON[payload]
        document["SocialTap"] ||= {}
        document["SocialTap"]["Sentiment140"] = "analyzed"
        self.store_output document
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
end