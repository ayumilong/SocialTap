#/usr/bin/rails runner

# SocialTap Analysis Framework

# The Node Manager starts worker processes (Analyzers), and reports back to the
# Job Manager.

DEBUG = true

require 'json'
require 'elasticsearch'
require 'bunny'
require './lib/analysis/analyzers/sentiment140analyzer'
# require Rails.root.join('lib', 'analysis', 'analyzers', 'sentiment140_analyzer.rb')
require 'pp' if DEBUG


module SocialTap
  module Analysis

    class NodeManager

      def initialize
        @workers = {}
        @analyzer_defs = {}
        @job_manager = false
        @contacted_jm = nil
        self.get_hostname
        self.load_config
        self.setup_queues
        # brace for a killing blow
        Signal.trap('INT') { 
          self.stop 
        }
        Signal.trap('TERM') { 
          self.stop 
        }
        self.start
      end

      def get_hostname
        @hostname = 'localhost'
      end

      def load_config
        APP_CONFIG["Analysis"].keys.each do |conf_section|
          section_name = /(.*)analyzer/.match conf_section
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
        @nodes_exchange = @channel.topic "socialtap.analysis.nodes"
        # connect to input queue
        jobmanager_queue = @channel.queue("jobmanager_to_nodes").bind(
          @nodes_exchange,
          routing_key: "socialtap.analysis.nodes.#.commands")
        jobmanager_queue.subscribe do |delivery_info, properties, payload|
          self.receive_message delivery_info, properties, payload
        end
      end

      def start
        @running = true
        while @running
          # have we got a job manager?
          if not @job_manager
            # have we already tried to reach the job manager?
            if not @contacted_jm
              self.send_message "register"
              @contacted_jm = Time.now
            # else
            #   time_since_contact = @contacted_jm ? Time.now - @contacted_jm : 0.0
            #   if time_since_contact % 5.0 < 0.00001
            #     puts "nodemanager: Waiting to hear back from jobmanager..." if DEBUG
            #   end
            #   if time_since_contact > 60
            #     puts "nodemanager: It's been 60 seconds since we contacted the job manager. JM may be offline. Trying again." if DEBUG
            #     self.send_message "register"
            #     @contacted_jm = Time.now
            #   end
            end
          end
        end
        self.stop
      end

      def stop
        # the kids must die
        @workers.each do |type, processes|
          processes.each do |id, worker|
            Process.kill 9, worker[:pid]
          end
        end
        @workers = {}
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
          msg_data["analyzer_type"] = @workers[worker_id][:type]
        elsif msg_type == "stopped_worker"
          msg_data["worker_id"] = worker_id
        elsif msg_type == "quit"
          msg_data["hostname"] = "localhost"
        end
        pp "nodemanager: Sending message to job manager:", msg_data if DEBUG
        @nodes_exchange.publish JSON[msg_data], routing_key: "socialtap.analysis.nodes.#{@hostname}.responses"
      end

      def receive_message delivery_info, properties, payload
        message = JSON[payload]
        pp "nodemanager: Got a new message:", message if DEBUG
        if message["type"] == "start_worker"
          # we need to start up a new worker
          analyzer_type = message["analyzer_type"]
          puts ""
          worker_id = message["id"]
          # TODO: Sanity checks
          # start up new analyzer process
          self.create_worker analyzer_type, worker_id
          # send message back to job manager that new worker is available for jobs
          self.send_message "started_worker", worker_id
        elsif message["type"] == "registered"
          # we have been registered with the job manager
          @job_manager = true
          @contacted_jm = nil
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
        # raise if not @analyzer_defs.has_key? type
        filename = @analyzer_defs[type][:filename]
        # load the code - require should only load it once
        # require Rails.root.join('lib', 'analysis', 'analyzers', filename).to_s
        # get class for new analyzer from type
        # start new process
        child_pid = fork { SocialTap::Analysis::Sentiment140.new id }
        # store new worker's process id, analyzer type, messaging queue
        @workers[id] = {pid: child_pid, type: type}
      end

    end

  end
end

SocialTap::Analysis::NodeManager.new
