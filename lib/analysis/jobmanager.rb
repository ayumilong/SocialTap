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



    class NodeManager
      def initialize
        @workers = {}
        @job_manager = false
        self.load_config
        self.setup_queues
        self.start
      end

      def load_config
        APP_CONFIG["Analysis"].keys.each do |analysis_config|
          if analysis_config.ends_with? "_analyzer"

          end
        end
      end

      def setup_queues
        @rabbitmq = Bunny.new
        @rabbitmq.start
        @channel = @rabbitmq.create_channel
        @workers_exchange = @channel.topic "analysis.workers"
        # connect to input queue
        @workers_queue = @channel.queue("workers").bind(@workers_exchange)
          self.receive_message delivery_info, properties, payload
        end
      end

      def start
        @running = true
        while @running
          # have we got a job manager?
          if not @job_manager
            # have we already tried to reach the job manager?

          end
        end
        self.stop
      end

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

      def send_message msg_type, worker_id = nil
        unless %w(register started_worker stopped_worker quit).include? msg_type
          puts "Unknown message type to send worker: #{msg_type}"
          self.stop
        end

        msg_data = {"type" => msg_type}
        if msg_type == "register"
          msg_data["hostname"] = "localhost"
        elsif msg_type == "started_worker"
          msg_data["worker_id"] = worker_id
        elsif msg_type == "stopped_worker"
          msg_data["worker_id"] = worker_id
        elsif msg_type == "quit"
          msg_data["hostname"] = "localhost"
        end

        pp "workermanager: Sending message to job manager:", msg_data if DEBUG
        @workers_exchange.publish JSON[msg_data], routing_key: "workers.#{@hostname}"
      end

      def receive_message delivery_info, properties, payload
        message = JSON[payload]
        pp "workermanager: Got a new message:", message if DEBUG
        if message["type"] == "start_worker"
          # we need to start up a new worker
          analyzer_type = message["analyzer"]
          worker_id = message["id"]
          # TODO: Sanity checks
          # start up new analyzer process
          self.create_worker analyzer_type, worker_id
          # send message back to job manager that new worker is available for jobs
          self.send_message "started_worker", worker_id
        elsif message["type"] == "registered"
          # we have been registered with the job manager
          @job_manager = true
        else
          puts "workermanager: Unknown message type: #{message['type']}"
          self.stop
        end
      end

      # instatiate a single analyzer process
      def create_worker type, id
        # look up type in definitions
        # get class for new analyzer from type
        # start new process
        child_pid = fork { SocialTap::Sentiment140.new id }
        # store pid of new worker's process, analyzer type, messaging queue
        @workers[id] = {"pid" => child_pid, "type" => type}
      end
    end

  end

end


SocialTap::Analysis::JobManager.new

