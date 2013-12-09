#!/usr/bin/ruby -w

require 'pp'
require 'json'
require 'curb'

module Gnip
  class HistoricalPowerTrack

    def initialize gnip_account, gnip_username, gnip_password, service_username
      @account_id = gnip_account
      @username = gnip_username
      @password = gnip_password
      @service_username = service_username
    end

    def request_estimate job_description, start_date, end_date, rules
      job_desc = job_description.gsub(/\s/, "_")
      timestamp = Time.now.strftime "%Y%m%d-%H%M%S"
      request_data = JSON[{
        'publisher' => 'twitter',
        'streamType' => 'track',
        'dataFormat' => 'activity-streams',
        'fromDate' => start_date.strftime("%Y%m%d0000"),
        'toDate' => end_date.strftime("%Y%m%d2359"),
        'title' => "#{job_desc}.#{timestamp}",
        'serviceUsername' => @service_username,
        'rules' => rules
      }]

      response = Curl::Easy.http_post api_url, request_data do |req|
        req.headers = {"Content-type" => "application/json"}
        req.http_auth_types = :basic
        req.username = @username
        req.password = @password
        # req.verbose = true
      end

      new_job_id = nil
      response_data = JSON[response.body_str]
      if response_data["status"] == "error"
        puts "Request error:"
        pp response_data
      else
        new_job_url = response_data["jobURL"]
        new_job_id = new_job_url.match(/\/(.*)\.json$/)[0]
      end
      log_action "Requested estimate.", response_data, request_data
      new_job_id
    end

    def get_all_jobs
      response = Curl::Easy.http_get api_url do |req|
        req.http_auth_types = :basic
        req.username = @username
        req.password = @password
        # req.verbose = true
      end

      response_data = JSON[response.body_str]
      log_action "Got all job statuses.", response_data
      response_data['jobs']
    end

    def get_job_status job_id
      response = Curl::Easy.http_get job_url(job_id) do |req|
        req.http_auth_types = :basic
        req.username = @username
        req.password = @password
        # req.verbose = true
      end

      response_data = JSON[response.body_str]
      log_action "Got job status.", response_data
      response_data
    end

    def respond_to_quote job_id, accept = false
      job_status = accept ? "accept" : "reject"
      request_data = JSON[{"status" => job_status}]

      response = Curl::Easy.http_put job_url(job_id), request_data do |req|
        req.headers = {"Content-type" => "application/json"}
        req.http_auth_types = :basic
        req.username = @username
        req.password = @password
        # req.verbose = true
      end

      response_data = JSON[response.body_str]
      if response_data["status"] == "error"
        puts "Error:"
        pp response_data
      end
      log_action "Responded to quote.", response_data, request_data
    end

private
    def api_url
      "https://historical.gnip.com/accounts/#{@account_id}/jobs.json"
    end

    def job_url job_id
      "https://historical.gnip.com/accounts/#{@account_id}/publishers/twitter/historical/track/jobs/#{job_id}.json"
    end

    def log_action comment, response_data, request_data = nil
      log_object = JSON[{"action" => comment,
        "timestamp" => Time.now.strftime("%Y/%m/%d %H:%M:%S"),
        "response" => response_data}]
      log_object["request"] = request_data unless request_data.nil?
      File.open("./log/gnip_historical.log", "a") do |job_log|
        job_log.write log_object
      end
    end

  end

end
