#!/usr/bin/ruby -w

require 'pp'
require 'json'
require 'curb'

module Gnip
  class HistoricalPowerTrack

    def initialize title, url, service_username, gnip_username, gnip_password
      @job_title = title
      @url = url
      @service_username = service_username
      @username = gnip_username
      @password = gnip_password
    end

    def request_estimate start_date, end_date, rules
      request_data = JSON[{
        'publisher' => 'twitter',
        'streamType' => 'track',
        'dataFormat' => 'activity-streams',
        'fromDate' => start_date.strftime("%Y%m%d0000"),
        'toDate' => end_date.strftime("%Y%m%d2359"),
        'title' => @job_title,
        'serviceUsername' => @service_username,
        'rules' => rules
      }]

      # puts "Job request:"
      # pp request_data

      begin
        response = Curl::Easy.http_post @url, request_data do |req|
          req.http_auth_types = :basic
          req.username = @username
          req.password = @password
          req.verbose = true
        end
      rescue e
        puts "Curl failed with error: #{e}"
        return nil
      end

      response_data = JSON[response.body_str]

      if response_data["status"] == "error"
        puts "Request error:"
        pp response_data
      end

      # response_data.each do |key, value|
      #   if request_data.has_key? key
      #     if request_data[key] != value
      #       puts "Warning: response value for job parameter #{key} differs from request."
      #       puts "request[#{key}]: #{request_data[key]}"
      #       puts "response[#{key}]: #{value}"
      #     end
      #   else
      #     puts "#{key}: #{value}"
      #   end
      # end

      File.open(job_log_path, "w+") do |job_log|
        job_log.write request_data
        job_log.write response_data
      end

    end

    def get_all_jobs
      response = Curl::Easy.http_get @url do |req|
        req.http_auth_types = :basic
        req.username = @username
        req.password = @password
        req.verbose = false
      end

      response_data = JSON[response.body_str]
      # pp response_data
      File.open(job_log_path, "w+") do |job_log|
        job_log.write response_data
      end

      response_data['jobs']
    end

    def get_job_status job_url
      response = Curl::Easy.http_get job_url do |req|
        req.http_auth_types = :basic
        req.username = @username
        req.password = @password
        req.verbose = false
      end

      response_data = JSON[response.body_str]
      # pp response_data
      File.open(job_log_path, "w+") do |job_log|
        job_log.write response_data
      end

      response_data
    end

    def respond_to_request
    end

private
    def job_log_path
      datestamp = Time.now.strftime "%Y%m%d%H%M%S"
      "./log/gnip_historical/#{datestamp}-#{@job_title}.json"
    end

  end

end
