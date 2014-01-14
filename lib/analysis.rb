#!/usr/bin/ruby -w

# should be used with Rails runner to get Rails environment


require 'elasticsearch'
require 'json'

module SocialTap
  class Analysis

  	def initialize
  	  @analyzers = []
  	  @es_client = Elasticsearch::Client.new(
        host: APP_CONFIG["Elasticsearch"]["hostname"],
        port: APP_CONFIG["Elasticsearch"]["port"],
        log: false)
      @running = true
      # load all the analyzers present
      self.create_analyzer_pool
      # start main loop
  	  self.start
  	end

  	def select_posts limit=nil
      # get list of indices to search 
      indices = []
      Dataset.find(:all).each do |dataset|
        indices << dataset.es_index
      end
  	  # build query for content documents with no SocialTap object
  	  missing_docs_query = {
    		"filtered" => {
    		  "query" => {
    		  	"match_all" => {}
    		  },
    		  "filter" => {
    		    "missing" => {
    		      "field" => "SocialTap",
    		      "existence" => true
    		    }
    		  }
    		}
      }
      # get results from ES
      missing_docs = @es_client.search query: missing_docs_query
  	  # TODO: get posts that have been flagged for reprocessing
      #docs_to_reprocess = {}
  	end

  	def create_analyzer_pool
  	  # return a list of all available post processors
  	  # get glob of filenames in post processing dir
  	  # for each file,
  	    # ruby-require file
  	    # read Analyzer class names from module
  	    # add Analyzer classes to list of all analyzers
  	end

  	def start
  	  # main loop to keep checking for things to process
      while @running
        # check for posts to process
        posts_to_process = select_posts
        # 
      end
  	end

  	def stop
  	  # end post processing
      # for each child process,
        # stop child process
      # stop main loop
      @running = false
  	end 
    
  end

  # parent class for Analyzers
  class Analyzer
  	def initialize name
      # subclasses may implement this, but should call super
      @name = name
      self.start
  	end

    def start
      @running = true
      self.run
    end

    def stop
      @running = false
    end

    def run
      # subclasses should implement this
    end

  	def analyze documents
  	  # subclasses should implement this
  	end
  end

end
