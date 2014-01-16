#!/usr/bin/rails runner

# Analysis framework for consuming data from Elasticsearch and starting
# Analyzer processes in a worker pool 

# should be used with Rails runner to get Rails environment

require 'elasticsearch'
require 'json'

module SocialTap
  class Analysis

  	def initialize
  	  @analyzer_pool = []
  	  @es_client = Elasticsearch::Client.new(
        host: APP_CONFIG["Elasticsearch"]["hostname"],
        port: APP_CONFIG["Elasticsearch"]["port"],
        log: false)
      @running = true
      # load all the analyzers present, creating pool of worker processes
      self.create_analyzer_pool
      # start main loop
  	  self.start
  	end

    # find all the documents in Elasticsearch which need analysis
  	def select_posts limit=nil
      # get list of indices to search 
      indices = []
      Dataset.find(:all).each do |dataset|
        indices << dataset.es_index
      end
  	  # build query for new documents. documents with no SocialTap object
      # haven't been analyzed yet
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

    # instatiate a single analyzer process
    def create_analyzer_worker
      # create interprocess messaging queue 
      # start new process
        # instantiate new object
      # store pid of new worker's process, analyzer name, messaging queue
    end

    # load all the analyzers present and create a pool of worker processes
  	def create_analyzer_pool
  	  # get glob of filenames in post processing dir
  	  # for each file,
  	    # ruby-require file
  	    # read Analyzer class names from module
  	    # start configured number of workers for each Analyzer

  	end

    # main loop to keep checking for things to process
  	def start
      while @running
        # check for posts to process
        posts_to_process = select_posts
        # for each analyzer type,
          # while there are more posts to send this analyzer
            # for each worker,
              # check the queue - count
      end
  	end

    # end all analysis
  	def stop
      # for each child process,
        # tell child to stop
      # wait for all children to quit
      # stop main loop
      @running = false
  	end 
    
  end

  # parent class for Analyzers
  class Analyzer

    # setup new Analyzer
  	def initialize name, worker = 0
      # subclasses may implement this, but should call super
      @name = name
      @worker = worker
      self.start
  	end

    # creates the communication queue for sending results to parent process
    def setup_results_queue
      # return queue name
    end

    # initiate main data analysis process loop
    def start
      @running = true
      self.run
    end

    # end main data analysis process loop
    def stop
      @running = false
    end

    # main data analysis loop: handle new data coming into the queue and
    # prepare for analysis
    def run
      # subclasses should implement this
      # simplest case: dequeue new documents to analyze, call analyze on all
    end

    # perform analysis on documents handled by main loop
  	def analyze documents
  	  # subclasses should implement this
  	end
  end

end
