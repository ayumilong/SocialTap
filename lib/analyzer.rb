#!/usr/bin/rails runner

# Analyzer base class for processes in a worker pool 

# should be used with Rails runner to get Rails environment

require 'json'
require 'elasticsearch'
require 'bunny'


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
      @input_exchange = @channel.fanout("analysis.new_documents")
      @results_exchange = @channel.topic("analysis.results")
      # connect to input queue
      @input_queue = @channel.queue("input").bind(@input_exchange)
      @input_queue.subscribe do |delivery_info, properties, payload|
        self.new_document delivery_info, properties, payload
      end
    end

    def new_document delivery_info, properties, payload
      puts "Got a new document: #{payload}"
      # return document to output
      self.analyze payload
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
    def analyze documents
    end

    def store_output documents
      documents.each do |document|
        @results_exchange.publish document, routing_key: "analysis.results.#{@name}.#{@id}"
      end
    end
  end
end
