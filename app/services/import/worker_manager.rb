module Import

class WorkerManager
	include Singleton

	PIDS_DIRECTORY = File.expand_path(File.join(File.dirname(__FILE__), "../../../tmp/pids/import"))

	VALID_WORKER_TYPES = ['file', 'gnip']

	def initialize
		# Ensure PIDs directory exists
		FileUtils.mkdir_p(PIDS_DIRECTORY) unless File.exist?(PIDS_DIRECTORY)
	end

	# Get a list of all import worker processes on all machines.
	# @return [Array] pid, type, and hostname of each worker.
	def all_worker_processes
		processes = Array.new

		if File.directory?(PIDS_DIRECTORY)
			Dir.foreach(PIDS_DIRECTORY) do |filename|
				next if filename == "." || filename == ".."

				match = /(.*?).(\d+?).pid/.match(filename)
				if match
					host = match.captures[0]
					pid = match.captures[1].to_i
					type = File.read(File.join(PIDS_DIRECTORY, filename)).strip

					processes.push({ host: host, pid: pid, type: type })
				end
			end
		end

		processes
	end

	# Get a list of all import worker processes on local machine.
	# @return [Array] pids and types of worker processes.
	def local_worker_processes
		all_worker_processes.select { |p| p[:host] == Socket.gethostname } .collect { |p| { pid: p[:pid], type: p[:type] } }
	end

	# Path to PID file for a local worker process.
	# @param [Integer] PID of local process.
	# @return [String] Path to PID file.
	def pid_file(pid)
		File.join(PIDS_DIRECTORY, "#{Socket.gethostname}-#{pid}.pid")
	end

	# Check if a specific process is an import worker.
	# @param [Integer] pid The PID of the process to check.
	# @return [Boolean]
	def process_is_worker?(pid)
		File.exists?(pid_file(pid))
	end

	# Remove PID files of local worker processes that are no longer running.
	def refresh_local_pid_files
		local_worker_processes.each do |p|
			puts "Checking #{p[:pid]}..."
			begin
				Process.kill(0, p[:pid])
			rescue Errno::ESRCH
				puts "Process #{p[:pid]} is not running"
				File.delete(pid_file(p[:pid]))
			end
		end
	end

	# Start an import worker process.
	# @param [String] type The type of imports for the process to handle.
	# @return [Integer] PID of worker process.
	def start_worker(type = 'file')
		raise ArgumentError, "'#{type}' is not a valid import worker type" unless VALID_WORKER_TYPES.include?(type)

		worker_script = File.join(File.dirname(__FILE__), "import_worker")
		worker_pid = Process.spawn(worker_script, type)
		Process.detach(worker_pid)

		worker_pid
	end

	# Stop specific import worker processes.
	# @param [Array] pids PIDs of the worker processes to stop.
	def stop_workers(pids = [])
		pids.each do |pid|
			begin
				Process.kill("INT", pid) rescue nil
				puts "Sent stop signal to #{pid}."
			rescue Errno::ESRCH
				puts "Process #{pid} is not running. Removing PID file."
				File.delete(pid_file(pid))
			end
		end
	end

	# Stop all import worker processes on this machine.
	def stop_all_local_workers
		stop_workers(local_worker_processes.collect { |p| p[:pid] })
	end

	# Get the type of imports handled by a local worker process.
	# @param [Integer] pid The PID of the process.
	# @return [String]
	def worker_type(pid)
		File.read(pid_file(pid)).strip if process_is_worker?(pid)
	end

end

end
