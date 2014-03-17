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
  module Analysis
    
    class JobManager

    	def initialize
        @posts_in_queue = []
        @counter = 0
    	  @es_client = Elasticsearch::Client.new(
          host: APP_CONFIG["Elasticsearch"]["hostname"],
          port: APP_CONFIG["Elasticsearch"]["port"],
          log: false)
        # create queues
        self.setup_queues
        # load all the analyzers present
        self.load_config
        # temporary - manually create worker proc for testing
        self.create_analyzer_worker "sentiment140"
        # start main loop
    	  self.start
    	end

      # connect to RabbitMQ, and create I/O exchanges for workers
      def setup_queues
        @rabbitmq = Bunny.new
        @rabbitmq.start
        @channel = @rabbitmq.create_channel
        @workers_exchange = @channel.fanout("analysis.workers")
        @nodes_exchange = @channel.topic("analysis.nodes")
        @results_exchange = @channel.topic("analysis.results")
        # subscribe to results messaging queue 
        response_queue = @channel.queue("analysis.workers").bind(
          @results_exchange,
          routing_key: "analysis.results.#.#")
        response_queue.subscribe do |delivery_info, properties, payload|
          self.process_analyzer_message delivery_info, properties, payload
        end
      end

      # load all the analyzers present and create a pool of worker processes
      def load_config
        @analyzers = {}
        # read config file
        # for each defined analyzer,
          # register it as available
          # how many workers?
      end

      # instatiate a single analyzer process
      def create_analyzer_worker type
        # start new process
        next_id = 12345
        child_pid = fork { SocialTap::Sentiment140.new(next_id) }
        # store pid of new worker's process, analyzer name, messaging queue
        @analyzers["sentiment140"] = {next_id => child_pid}
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
        field_name = "SocialTap"
        field_name += ".#{analyzer}" if analyzer
        missing_docs_query = {
          # "_source" => false, # only available in Elasticsearch >= 1.0
          "query" => { "filtered" => {
              "filter" => { "missing" => {
                  "field" => field_name,
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
              @posts_in_queue << index_type_id
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
        @analyzers.keys.each do |analyzer_type|
          analyzer_type.values.each do |child_pid|
            Process.kill 9, child_pid
          end
        end
        # stop main loop
        @running = false
    	end 

      def process_analyzer_message delivery_info, properties, payload
        # process the message
        pattern = /#{delivery_info[:exchange]}\.(?<type>.*)\.(?<id>.*)/
        analyzer_info = pattern.match delivery_info[:routing_key]
        response = JSON[payload]
        puts "Received analyzer message: #{response['type']} from #{analyzer_info['type']}.#{analyzer_info['id']}" if DEBUG
      end

    end

  end
end


SocialTap::Analysis::JobManager.new

