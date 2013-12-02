#!/usr/bin/ruby -w

# sentiment140.rb - sentiment-code data using Sentiment 140 API

require 'curb'
require 'json'

module Sentiment140
  API_URL = 'http://www.sentiment140.com/api'

  class QueryAPI

    def initialize app_id
      @app_id = app_id
    end

    def get_sentiment text, subject = nil
      url = s140_url 'classify', {appid: @app_id, text: text, query: subject}
      response = Curl.get url
      JSON[response.body_str]['results']['polarity']
    end

    def get_bulk_sentiment input_objects
      url = s140_url 'bulkClassifyJson', {appid: @app_id}
      post_data = JSON[{'data' => input_objects}]
      response = Curl::Easy.http_post url, post_data
      JSON[response.body_str]['data']
    end

    def s140_url type, params
      Curl::urlalize "#{API_URL}/#{type}", params
    end

  end
end
