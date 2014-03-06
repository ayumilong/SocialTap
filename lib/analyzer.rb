#!/usr/bin/rails runner

# Analyzer base class for processes in a worker pool 

# should be used with Rails runner to get Rails environment

DEBUG_ANALYZER = false

require 'json'
require 'elasticsearch'
require 'bunny'
require 'pp' if DEBUG_ANALYZER

module SocialTap

  # parent class for Analyzers
  class Analyzer

    # setup new Analyzer
    def initialize analyzer_name, id
      # subclasses may implement this, but should call super
      @name = analyzer_name
      @id = id
      @es_client = Elasticsearch::Client.new(
        host: APP_CONFIG["Elasticsearch"]["hostname"],
        port: APP_CONFIG["Elasticsearch"]["port"],
        log: false)
      self.setup_queues
      self.start
    end

    # creates the communication queue for sending results to parent process
    def setup_queues
      @rabbitmq = Bunny.new
      @rabbitmq.start
      @channel = @rabbitmq.create_channel
      @input_exchange = @channel.fanout "analysis.new_documents"
      @results_exchange = @channel.topic "analysis.results"
      # connect to input queue
      @input_queue = @channel.queue("input").bind(@input_exchange)
      @input_queue.subscribe do |delivery_info, properties, payload|
        self.receive_message delivery_info, properties, payload
      end
    end

    def receive_message delivery_info, properties, payload
      message = JSON[payload]
      pp "#{@name}.#{@id}: Got a new message:", message if DEBUG_ANALYZER
      if message["type"] == "analyze"
        id_parts = message["id"].split '/'
        index = id_parts[0]
        type = id_parts[1]
        id = id_parts[2]
        document = self.get_document index, type, id
        self.analyze document
      else
        puts "#{@name}.#{@id}: Unknown message type: #{message['type']}"
        self.stop
      end
    end

    def get_document index, type, id
      begin
        document = @es_client.get index: index, type: type, id: id 
      rescue Exception => e
        puts "#{@name}.#{@id}: Error getting document for analysis: #{e}"
        self.stop
      end
      pp "#{@name}.#{@id}: Fetched document #{id} from ES." if DEBUG_ANALYZER
      document
    end

    # initiate main data analysis process loop
    def start
      @running = true
      self.run
    end

    # end main data analysis process loop
    def stop
      @running = false
      self.send_message "quit"
    end

    # loop until further notice
    def run
      while @running
        self.step
      end
    end

    def step
    end

    # perform analysis on documents handled by main loop
    # subclasses should implement this
    def analyze document
    end

    def update_document index, type, id, document
      @es_client.index index: index, type: type, id: id, body: document
    end

    def send_message msg_type, post_id = nil
      unless %w(analyzed quit).include? msg_type
        puts "Unknown message type to send worker: #{msg_type}"
        self.stop
      end

      msg_data = {"type" => msg_type}
      if msg_type == "analyzed"
        msg_data["id"] = post_id
      end

      pp "Sending analyzer message:", msg_data if DEBUG_ANALYZER
      @results_exchange.publish JSON[msg_data], routing_key: "analysis.results.#{@name}.#{@id}"
    end
  end
end
