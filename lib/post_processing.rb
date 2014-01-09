#!/usr/bin/ruby -w

# should be used with Rails runner to get Rails environment


require 'elasticsearch'
require 'json'

module SocialTap
  class Analysis

  	def initialize
  	  @analyzers = []
  	  @es_client = ESStorage.new
  	  self.start
  	end

	def select_posts limit=nil
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
	  # get posts that have been flagged for reprocessing
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

	def get_analyzer name
	  # find a post processor and load it so that it can be run
	end

	def start
	  # main loop to keep checking for things to process

	end

	def stop
	  # end post processing
	end
  end

  # parent class for Analyzers
  class Analyzer
  	def initialize
  	end

  	def analyze documents
  	  # subclasses should implement this
  	end
  end

end
