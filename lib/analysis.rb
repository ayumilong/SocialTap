#!/usr/bin/rails runner

# Analysis framework for consuming data from Elasticsearch and starting
# Analyzer processes in a worker pool 

# should be used with Rails runner to get Rails environment

require 'json'
require 'elasticsearch'
require 'bunny'
require './lib/analyzers/sentiment140_analyzer.rb'


module SocialTap
  class Analysis

  	def initialize
  	  @analyzer_pool = []
  	  @es_client = Elasticsearch::Client.new(
        host: APP_CONFIG["Elasticsearch"]["hostname"],
        port: APP_CONFIG["Elasticsearch"]["port"],
        log: false)
      # create queues
      self.setup_queues
      # load all the analyzers present, creating pool of worker processes
      self.create_analyzer_pool
      # start main loop
  	  self.start
  	end

    # connect to RabbitMQ, and create I/O queues for workers
    def setup_queues
      @rabbitmq = Bunny.new
      @rabbitmq.start
      @channel = @rabbitmq.create_channel
      @input_exchange = @channel.fanout("analysis.new_documents")
      @results_exchange = @channel.topic("analysis.results")
    end

    # load all the analyzers present and create a pool of worker processes
    def create_analyzer_pool
      # get glob of filenames in post processing dir
      # for each file,
        # ruby-require file
        # read Analyzer class names from module
        # start configured number of workers for each Analyzer
      @analyzers = []
      one_analyzer = fork { SocialTap::Sentiment140.new(12345) }
      @analyzers << one_analyzer
      self.create_analyzer_worker
    end

    # instatiate a single analyzer process
    def create_analyzer_worker
      # subscribe to results messaging queue 
      output_queue = @channel.queue("analysis.results").bind(@results_exchange, routing_key: "analysis.results.#.#")
      output_queue.subscribe do |delivery_info, properties, payload|
        self.store_output delivery_info, properties, payload
      end
      # start new process
        # instantiate new object
      # store pid of new worker's process, analyzer name, messaging queue
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
        "query" => {
          "filtered" => {
            "filter" => {
              "missing" => {
                "field" => "SocialTap",
                "existence" => true
              }
            }
          }
        }
      }
      # get results from ES
      begin
        missing_docs = @es_client.search body: missing_docs_query
        # TODO: get posts that have been flagged for reprocessing
        #docs_to_reprocess = {}
        # json_missing_docs = JSON[missing_docs]
        puts "found missing docs: #{missing_docs}"
      rescue Exception => e
        puts "Error selecting unanalyzed posts: #{e}"
        @analyzers.each do |pid|
          Process.kill 9, pid
        end
      end
      missing_docs["hits"]["hits"]
    end

    # main loop to keep checking for things to process
  	def start
      puts "main analysis loop"
      @running = true
      while @running
        # check for posts to process
        posts_to_process = self.select_posts

        posts_to_process.each do |post|
          puts "publishing post: #{post}"
          @input_exchange.publish JSON[post]
        end
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
    
    def store_output delivery_info, properties, payload
      # lookup document by ID in ES10
      document = JSON[payload]
      puts "received a store output message:"
      pp document
    end
  end

end


SocialTap::Analysis.new

