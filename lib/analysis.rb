#!/usr/bin/rails runner

# Analysis framework for consuming data from Elasticsearch and starting
# Analyzer processes in a worker pool 

# should be used with Rails runner to get Rails environment

DEBUG = true

require 'json'
require 'elasticsearch'
require 'bunny'
require './lib/analyzers/sentiment140_analyzer.rb'
require 'pp' if DEBUG


module SocialTap
  class Analysis

  	def initialize
      @counter = 0
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

    # connect to RabbitMQ, and create I/O exchanges for workers
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
      response_queue = @channel.queue("analysis.results").bind(
        @results_exchange,
        routing_key: "analysis.results.#.#")
      response_queue.subscribe do |delivery_info, properties, payload|
        self.process_analyzer_message delivery_info, properties, payload
      end
      # start new process
        # instantiate new object
      # store pid of new worker's process, analyzer name, messaging queue
    end

    # find all the documents in Elasticsearch which need analysis
    def select_posts analyzer = nil, limit = nil
      # get list of indices to search 
      indices = []
      Dataset.find(:all).each do |dataset|
        indices << dataset.es_index
      end
      # build query for new documents. documents with no SocialTap object
      # haven't been analyzed yet
      missing_docs_query = {
        "query" => { "filtered" => {
            "filter" => { "missing" => {
                "field" => "SocialTap",
                "existence" => true
      } } } } }
      # get results from ES
      begin
        missing_docs = @es_client.search body: missing_docs_query
        # TODO: get posts that have been flagged for reprocessing
        #docs_to_reprocess = {}
        # json_missing_docs = JSON[missing_docs]
        puts "Selected #{missing_docs["hits"]["total"]} posts for analysis." if DEBUG
      rescue Exception => e
        puts "Error selecting posts for analysis: #{e}"
        self.stop
      end
      missing_docs["hits"]["hits"]
    end

    def send_workers_message msg_type, post_id = nil
      msg_data = {"type" => msg_type}
      if msg_type == "analyze"
        msg_data["id"] = post_id
      else
        puts "Unknown message type to send worker: #{msg_type}"
        self.stop
      end
      pp "Sending workers message:", msg_data if DEBUG
      @input_exchange.publish JSON[msg_data]
    end

    # main loop to keep checking for things to process
  	def start
      @running = true
      while @running
        # check for posts to process
        posts_to_process = self.select_posts if @counter <= 3

        posts_to_process.each do |post|
          if @counter <= 3
            index_type_id = "#{post["_index"]}/#{post["_type"]}/#{post["_id"]}"
            self.send_workers_message "analyze", index_type_id
          end
          @counter += 1
        end
        # for each analyzer type,
          # while there are more posts to send this analyzer
            # for each worker,
              # check the queue - count
      end
      self.stop
  	end

    # end all analysis
  	def stop
      # the kids must die
      @analyzers.each do |child_pid|
        Process.kill 9, child_pid
      end
      # stop main loop
      @running = false
  	end 

    def process_analyzer_message delivery_info, properties, payload
      response = JSON[payload]
      pp "Received analyzer message: #{response['type']}", delivery_info, properties if DEBUG
      # process the message
    end
  end

end


SocialTap::Analysis.new

