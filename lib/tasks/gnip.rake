# These rake tasks control a subprocess, tracked via a pidfile, which consumes
# Twitter data from a Gnip PowerTrack stream. When received, the tweets are
# indexed in Elasticsearch and

namespace 'index-powertrack' do
  desc "Start up a new Gnip PowerTrack stream consumption process."
  task 'start' => 'environment' do
    # check for existing process
    pid = get_pid
    if get_status(pid)
      puts "Already running process #{pid}"
      exit
    end

    child_pid = Process.spawn('rails', 'runner', './lib/run_gnip_stream.rb', {
      :out => [Rails.root.join('log', 'index-powertrack.log'), 'a'],
      :err => [Rails.root.join('log', 'index-powertrack.err'), 'a']
    })
    puts "Started new Gnip PowerTrack stream consumption process #{child_pid} => #{pid_filename}"
    File.open(pid_filename, 'w') { |file| file.write(child_pid) }
    Process.detach(child_pid)
  end

  desc "Stop a running Gnip PowerTrack stream consumption process."
  task 'stop' => 'environment' do
    pid = get_pid
    if pid
      begin
        Process.kill 'HUP', pid
        puts "Sent signal to process #{pid}"
      rescue
        puts "Failed: unable to stop process #{pid}"
      end
      remove_pidfile
    else
      puts "Not running"
    end
  end

  desc "Get the status on Gnip PowerTrack stream consumption."
  task 'status' => 'environment' do
    pid = get_pid
    if get_status(pid)
      puts "Running process #{pid}"
    else
      puts "Stopped"
    end
  end

  desc "Restart Gnip PowerTrack stream consumption."
  task 'restart' => ['stop', 'start']

  def get_status(pid = nil)
    pid ||= get_pid
    return false if pid.nil?
    begin
      status = Process.kill 0, pid
    rescue
      # Could not get status of pid, pidfile must be stale
      puts "Error getting status for #{pid}, removing stale pidfile."
      remove_pidfile
      return false
    end
    status
  end

  def get_pid
    return nil if not File.exists? pid_filename
    begin
      pid_file = File.open(pid_filename, 'r')
      pid = pid_file.read.to_i
      pid_file.close
    rescue StandardError => e
      puts "Error opening/reading pidfile #{pid_filename}: #{e}"
      return nil
    end
    pid
  end

  def remove_pidfile
    File.delete(pid_filename) if File.exists? pid_filename
  end

  def pid_filename
    Rails.root.join('tmp', 'pids', 'index-powertrack.pid')
  end
end
