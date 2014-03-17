#!/usr/bin/rails runner

# Analysis framework for consuming data from Elasticsearch and starting
# Analyzer processes in a worker pool 

# should be used with Rails runner to get Rails environment

DEBUG = true

require 'json'
require 'elasticsearch'
require 'bunny'
require 'pp' if DEBUG


module SocialTap
  module Analysis

    class NodeManager

      def initialize
        @workers = {}
        @analyzer_defs = {}
        @job_manager = false
        self.load_config
        self.setup_queues
        self.start
      end

      def load_config
        APP_CONFIG["Analysis"].keys.each do |conf_section|
          section_name = conf_section.match /(.*)_analyzer/
          if section_name
            type = section_name[1]
            @analyzer_defs[type] = APP_CONFIG["Analysis"][conf_section]
            @analyzer_defs[type][:filename] = section_name
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
            break
            # have we already tried to reach the job manager?
            # TODO: check message queue for job manager to see if we sent it
            # 
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

        pp "nodemanager: Sending message to job manager:", msg_data if DEBUG
        @workers_exchange.publish JSON[msg_data], routing_key: "workers.#{@hostname}"
      end

      def receive_message delivery_info, properties, payload
        message = JSON[payload]
        pp "nodemanager: Got a new message:", message if DEBUG
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
        elsif message["type"] == "quit"
          # die now
          self.stop
        else
          puts "nodemanager: Unknown message type: #{message['type']}"
          self.stop
        end
      end

      # instatiate a single analyzer process
      def create_worker type, id
        # make sure type is in definitions
        raise if not @analyzer_defs.has_key? type
        filename = @analyzer_defs[type][:filename]
        # load the code - require should only load it once
        require Rails.root.join('lib', 'analysis', 'analyzers', filename)
        # get class for new analyzer from type
        # start new process
        child_pid = fork { SocialTap::Analysis::Sentiment140.new id }
        # store pid of new worker's process, analyzer type, messaging queue
        @workers[id] = {"pid" => child_pid, "type" => type}
      end

    end

  end
end


SocialTap::Analysis::NodeManager.new
