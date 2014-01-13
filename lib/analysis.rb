#!/usr/bin/ruby -w

# should be used with Rails runner to get Rails environment


require 'elasticsearch'
require 'json'

module SocialTap
  class Analysis

  	def initialize
  	  @analyzers = []
  	  @es_client = ESStorage.new
      @run = true
      # load all the analyzers present
      self.update_analyzers_list
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

  	def update_analyzers_list
  	  # return a list of all available post processors
  	  # get glob of filenames in post processing dir
  	  # for each file,
  	    # ruby-require file
  	    # read Analyzer class names from module
  	    # add Analyzer classes to list of all analyzers
  	end

  	def start
  	  # main loop to keep checking for things to process
      while @run
        # check for posts to process
        posts_to_process = select_posts
        # 
      end
  	end

  	def stop
  	  # end post processing
      @run = false
  	end 
    
  end

  # parent class for Analyzers
  class Analyzer
  	def initialize
      # subclasses may implement this
  	end

  	def analyze documents
  	  # subclasses should implement this
  	end
  end

end
