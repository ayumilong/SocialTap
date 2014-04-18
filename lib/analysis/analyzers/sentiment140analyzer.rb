#!/usr/bin/rails runner

# analyzer for sentiment140.com sentiment tagging

require './lib/analysis/analyzer'
require './lib/sentiment140'
require 'pp' if DEBUG

BULK_SENTIMENT_QTY = 2000

module SocialTap
  module Analysis
    class Sentiment140 < SocialTap::Analysis::Analyzer

      def initialize worker_id
        @steps_to_death = 0
        @s140_client = ::Sentiment140::QueryAPI.new APP_CONFIG['Sentiment140']['app_id']
        @document_cache = []
        super "sentiment140", worker_id
      end

      def step
        sleep 1
        @steps_to_death += 1
        puts "#{@name}.#{@id}: I'm not dead yet!" if DEBUG
        self.stop if @steps_to_death > 6
      end

      def analyze document
        # pp "#{@name}.#{@id}: Time to analyze a document.", document if DEBUG
        self.send_message "analyzed", document["_id"]
      end

      def bulk_analyze
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