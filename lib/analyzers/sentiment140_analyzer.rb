#!/usr/bin/rails runner

require './lib/sentiment140'

# analyzer for sentiment140.com sentiment tagging
BULK_SENTIMENT_QTY = 2000

class Sentiment140Analyzer < SocialTap::Analyzer
  @field = "sentiment140"
  @


  def initialize
    @s140_client = Sentiment140::QueryAPI.new APP_CONFIG['Sentiment140']['app_id']
  end

  def analyze documents
    # put new documents on the queue
    # check queue size - if BULK_SENTIMENT_QTY is reached then send them off
    # for each result, 
      # update document with 
    # return documents
  end

end
