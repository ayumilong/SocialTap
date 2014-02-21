#!/usr/bin/ruby -w

require 'pp'
require 'json'
require 'curb'

MAX_CONCURRENT_DOWNLOADS = 100
MAX_OPEN_FILES = 500


module Gnip
  class HistoricalPowerTrack

    def initialize gnip_account, gnip_username, gnip_password, service_username
      @account_id = gnip_account
      @username = gnip_username
      @password = gnip_password
      @service_username = service_username
    end

    def request_estimate job_description, start_date_time, end_date_time, rules, format="activity-streams"
      raise if not start_date_time.is_a? DateTime or not end_date_time.is_a? DateTime
      job_desc = job_description.gsub(/\s/, "_")
      timestamp = Time.now.strftime "%Y%m%d-%H%M%S"
      request_data = JSON[{
        'publisher' => 'twitter',
        'streamType' => 'track',
        'dataFormat' => format,
        'fromDate' => start_date_time.strftime("%Y%m%d%H%M"),
        'toDate' => end_date_time.strftime("%Y%m%d%H%M"),
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

    def download_results job_id, data_directory
      # request job data and parse
      job_status = self.get_job_status job_id

      response = Curl::Easy.http_get results_url(job_id) do |req|
        req.http_auth_types = :basic
        req.username = @username
        req.password = @password
        # req.verbose = true
      end

      response_data = JSON[response.body_str]
      all_urls = response_data["urlList"]
      # files_downloaded = 0
      # pp response_data["urlList"]
      # multi_download = Curl::Multi.new
      # downloads = {}
      # response_data["urlList"].each do |url|
      #   puts "Downloading URL: #{url}"
      #   downloads[url] = Curl::Easy.download url
      #   multi_download.add downloads[url]
      #   if downloads.size >= MAX_CONCURRENT_DOWNLOADS
      #     sleep 0.5
      #     downloads.each do |download|
      #       if 
      #     end
      #   end
      #   break if files_downloaded > 5 
      # end
      # puts "Files downloaded: #{files_downloaded}"
      easy_options = {}
      multi_options = {
        'max_connects' => MAX_CONCURRENT_DOWNLOADS
      }
      all_urls.each_slice(MAX_OPEN_FILES).each do |urls|
        download_paths = urls.collect { |url|
          filename = url.split(/\?/).first.split(/#{@account_id}\/\d{4}\/\d{2}\/\d{2}\//).last.sub(/\//, '-').gsub(/\//, '_')
          "#{data_directory}/#{filename}"
        }

        multi_download = Curl::Multi.download urls, easy_options, multi_options, download_paths
        # multi_download.perform
      end
      job_status
      #pp response_data
    end

private
    def api_url
      "https://historical.gnip.com/accounts/#{@account_id}/jobs.json"
    end

    def job_url job_id
      "https://historical.gnip.com/accounts/#{@account_id}/publishers/twitter/historical/track/jobs/#{job_id}.json"
    end

    def results_url job_id, format = "json"
      "https://historical.gnip.com/accounts/#{@account_id}/publishers/twitter/historical/track/jobs/#{job_id}/results.#{format}"
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
