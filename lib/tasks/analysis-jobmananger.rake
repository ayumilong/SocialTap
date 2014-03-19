# These rake tasks control a subprocess, tracked via a pidfile, which 

namespace 'analysis-jobmanager' do
  desc "Start up an Analysis Job Manager process."
  task 'start' => 'environment' do
    # check for existing process
    pid = get_pid
    if get_status(pid)
      puts "Already running process #{pid}"
      exit
    end

    child_pid = Process.spawn('rails', 'runner', './lib/analysis/jobmanager.rb', {
      :out => [Rails.root.join('log', 'analysis-jobmanager.log'), 'a'],
      :err => [Rails.root.join('log', 'analysis-jobmanager.err'), 'a']
    })
    puts "Started new Analysis Job Manager process #{child_pid} => #{jm_pid_filename}"
    File.open(jm_pid_filename, 'w') { |file| file.write(child_pid) }
    Process.detach(child_pid)
  end

  desc "Stop a running Analysis Job Manager process."
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

  desc "Get the status on Analysis Job Manager."
  task 'status' => 'environment' do
    pid = get_pid
    if get_status(pid)
      puts "Running process #{pid}"
    else
      puts "Stopped"
    end
  end

  desc "Restart Analysis Job Manager."
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
    return nil if not File.exists? jm_pid_filename
    begin
      pid_file = File.open(jm_pid_filename, 'r')
      pid = pid_file.read.to_i
      pid_file.close
    rescue StandardError => e
      puts "Error opening/reading pidfile #{jm_pid_filename}: #{e}"
      return nil
    end
    pid
  end

  def remove_pidfile
    File.delete(jm_pid_filename) if File.exists? jm_pid_filename
  end

  def jm_pid_filename
    Rails.root.join('tmp', 'pids', 'analysis-jobmanager.pid')
  end
end
