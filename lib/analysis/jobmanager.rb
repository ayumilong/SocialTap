#!/usr/bin/rails runner

# SocialTap Analysis Framework

# The Job Manager starts worker processes (Analyzers) on different nodes, 
# queries Elasticsearch for posts needing analysis, and assigns posts to
# workers.

DEBUG = true

require 'json'
require 'elasticsearch'
require 'bunny'
require 'pp' if DEBUG


module SocialTap
  module Analysis
    
    class JobManager

    	def initialize
        @next_worker_id = 1
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
        # brace for a killing blow
        Signal.trap('INT') { 
          self.stop 
        }
        Signal.trap('TERM') { 
          self.stop 
        }
        # start main loop
    	  self.start
    	end

      # connect to RabbitMQ, and create I/O exchanges for workers and nodes
      def setup_queues
        @rabbitmq = Bunny.new
        @rabbitmq.start
        @channel = @rabbitmq.create_channel
        # exchange for communication between Job Manager and NodeManagers
        @nodes_exchange = @channel.topic "socialtap.analysis.nodes"
        # queue for responses from nodes
        nodes_queue = @channel.queue("node_to_jobmanager").bind(
          @nodes_exchange,
          routing_key: "socialtap.analysis.nodes.#.responses")
        nodes_queue.subscribe do |delivery_info, properties, payload|
          self.process_node_message delivery_info, properties, payload
        end
        # exchange for communication between JobManager and workers
        @workers_exchange = @channel.topic "socialtap.analysis.workers"
        # queue for responses from workers
        workers_queue = @channel.queue("worker_to_jobmanager").bind(
          @workers_exchange,
          routing_key: "socialtap.analysis.workers.#.responses")
        workers_queue.subscribe do |delivery_info, properties, payload|
          self.process_worker_message delivery_info, properties, payload
        end
      end

      # load all the analyzers present and create a pool of worker processes
      def load_config
        @analyzers = {}
        @nodes = {}
        APP_CONFIG["Analysis"].keys.each do |conf_section|
          section_name = /(.*)analyzer/.match conf_section
          if section_name
            type = section_name[1]
            @analyzers[type] = APP_CONFIG["Analysis"][conf_section]
            @analyzers[type][:filename] = section_name
          end
        end
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

      def send_node_message msg_type, hostname, analyzer_type = nil, worker_id = nil
        msg_data = {"type" => msg_type}
        if msg_type == "registered"
          # no special stuff for this message type
        elsif msg_type == "start_worker"
          msg_data['analyzer_type'] = analyzer_type
          msg_data['id'] = worker_id
        elsif msg_type == "quit"
          # no special stuff for this message type
        else
          puts "Unknown message type to send node: #{msg_type}"
          self.stop
        end
        pp "Sending node message:", msg_data if DEBUG
        @nodes_exchange.publish JSON[msg_data], routing_key: "socialtap.analysis.nodes.#{hostname}.commands"
      end

      def process_node_message delivery_info, properties, payload
        pattern = /#{delivery_info[:exchange]}\.(?<hostname>.*)\.response/
        node_info = pattern.match delivery_info[:routing_key]
        response = JSON[payload]
        puts "Received node message: #{response['type']} from #{node_info['hostname']}" if DEBUG
        if response["type"] == "register"
          puts "problems looking up hostname?" if DEBUG
          @nodes[node_info['hostname']] = {}
          self.send_node_message "registered", node_info['hostname']
        elsif response["type"] == "started_worker"
          @nodes[node_info['hostname']][response['analyzer_type']] ||= []
          @nodes[node_info['hostname']][response['analyzer_type']] << response['worker_id']
        else
          puts "Unknown node message type #{response['type']}"
        end
      end

      def send_worker_message msg_type, worker_id, post_id = nil
        msg_data = {"type" => msg_type}
        if msg_type == "analyze"
          msg_data["id"] = post_id
        else
          puts "Unknown message type to send worker: #{msg_type}"
          self.stop
        end
        pp "Sending workers message:", msg_data if DEBUG
        @workers_exchange.publish JSON[msg_data], routing_key: "socialtap.analysis.workers.#{worker_id}.commands"
      end

      def process_worker_message delivery_info, properties, payload
        pattern = /#{delivery_info[:exchange]}\.(?<id>.*)\.response/
        worker_info = pattern.match delivery_info[:routing_key]
        response = JSON[payload]
        puts "Received worker message: #{response['type']} from #{worker_info['id']}" if DEBUG
      end

      # main loop to keep checking for things to process
    	def start
        @running = true
        while @running
          # self.step
          self.step
        end
        self.stop
    	end

      # end all analysis
      def stop
        # tell all the nodes (and thus workers) to stop
        if not @nodes.empty?
          @nodes.keys.each do |hostname|
            self.send_node_message "quit", hostname
          end
          @nodes.clear
        end
        # delete message exchanges
        if @workers_exchange
          @workers_exchange.delete
          @workers_exchange = nil
        end
        if @nodes_exchange
          @nodes_exchange.delete 
          @nodes_exchange = nil
        end
        # stop main loop
        @running = false
      end

      def test_step
        # check for posts to process
        posts_to_process = []
        posts_to_process = self.select_posts if @counter <= 3

        posts_to_process.each do |post|
          if @counter <= 3
            index_type_id = "#{post["_index"]}/#{post["_type"]}/#{post["_id"]}"
            self.send_worker_message "analyze", index_type_id
            @posts_in_queue << index_type_id
          end
          @counter += 1
        end
      end

      def step
        # do we have any nodes even?
        return if @nodes.empty?
        # make sure there are enough workers 
        self.start_workers
        # how many posts do we have to process? query sum of posts missing each analyzer type
        # when over the chunk limit, switch to bulk processing mode
        # bulk processing: select chunk of posts for each analyzer type
        # individual doc mode: chunk size is 1

        # # for each analyzer type,
        # @analyzers.each do |type, analyzer|
        #   # check how many posts need to be analyzed for this type
        #   posts_to_process = self.select_posts type
        #   # while there are more posts to send this analyzer
        #   posts_to_process.each do |post|
        #     # for each worker,
        #       # check the queue - count
        #     if @counter <= 3
        #       index_type_id = "#{post["_index"]}/#{post["_type"]}/#{post["_id"]}"
        #       self.send_worker_message "analyze", index_type_id
        #       @posts_in_queue << index_type_id
        #     end
        #     @counter += 1
        #   end
        # end
      end

      def start_workers
        # puts "starting workers" if DEBUG
        @analyzers.each do |type, analyzer|
          # puts "analyzer #{type} needs #{analyzer["workers"]} workers." if DEBUG
          @nodes.each do |hostname, node_analyzers|
            if not node_analyzers.has_key? type
              puts "node #{hostname} doesn't have a #{type} worker, sending start message" if DEBUG
              send_node_message "start_worker", hostname, type, @next_worker_id
              @nodes[hostname][type] ||= []
              @next_worker_id += 1
            end
          end
        end
      end

    end

  end
end


SocialTap::Analysis::JobManager.new

