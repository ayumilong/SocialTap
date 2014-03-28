require 'fileutils'
require 'socket'

namespace :import do
	desc "Start import worker processes"
	task :start, :type, :number do |t, args|
		args.with_defaults({ type: 'file', number: 1 })

		puts "Starting #{args[:number]} #{args[:type]} worker#{args[:number].to_i > 1 ? "s" : ""}..."

		# Ensure PIDs directory exists
		pids_directory = File.join(File.dirname(__FILE__), "../../tmp/pids/import")
		FileUtils.mkdir_p(pids_directory) unless File.exist?(pids_directory)

		# Spawn the specified number of processes
		args[:number].to_i.times do |i|

			worker_script = File.join(File.dirname(__FILE__), "../../app/services/import/import_worker")
			worker_pid = Process.spawn(worker_script, args[:type])
			Process.detach(worker_pid)

			# Store worker PID and type
			File.open(pid_file(worker_pid), "w") do |f|
				f.puts args[:type]
			end

			puts "#{worker_pid}"
		end
	end

	desc "Lists import worker processes"
	task :list do

		# Get host, PID, and type of all worker processes.
		worker_processes = Hash.new
		all_worker_processes.each do |p|
			worker_processes[p[:type]] = Hash.new if worker_processes[p[:type]].nil?
			worker_processes[p[:type]][p[:host]] = Array.new if worker_processes[p[:type]][p[:host]].nil?
			worker_processes[p[:type]][p[:host]].push(p[:pid])
		end

		if worker_processes.empty?
			puts "No worker processes found"
			exit
		end

		# Display hierarchically by type, host, and PID
		types = worker_processes.keys.sort
		types.each do |type|
			puts "#{type}"
			processes_of_type = worker_processes[type]

			hosts = processes_of_type.keys.sort
			hosts.each do |host|
				puts "   #{host}"
				processes_of_type[host].each do |pid|
					puts "      #{pid}"
				end
			end
		end
	end

	task :test do
		puts all_worker_processes
	end

	desc "Stop an import worker process"
	task :stop, :pid do |t, args|
		if args[:pid].nil?
			$stderr.puts "PID required"
			exit(false)
		end

		if args[:pid].is_a?(Fixnum)
			if !File.exists?(pid_file(args[:pid]))
				puts "Process #{args[:pid]} is not an import worker"
				exit(false)
			end

			pids = [ args[:pid].to_i ]

		elsif args[:pid] == 'all'
			pids = local_worker_processes.collect { |p| p[:pid] }
		else # Use argument as a worker type
			pids = local_worker_processes.select { |p| p[:type] == args[:pid] } .collect { |p| p[:pid] }
		end

		if pids.count == 0
			puts "No worker processes found"
			exit
		end

		pids.each do |pid|
			begin
				Process.kill("INT", pid) rescue nil
				File.delete(pid_file(pid))
				puts "Stopped #{pid}"
			rescue Errno::ESRCH
				puts "Process #{pid} is not running. Removing PID file."
				File.delete(pid_file(pid))
			end
		end
	end

	desc "Remove orphaned PID files"
	task :refresh do
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

	# Get a list of all import worker processes on all machines.
	# @return [Array] pid, type, and hostname of each worker.
	def all_worker_processes
		processes = Array.new

		pids_directory = File.join(File.dirname(__FILE__), "../../tmp/pids/import")
		if File.directory?(pids_directory)
			Dir.foreach(pids_directory) do |filename|
				next if filename == "." || filename == ".."

				match = /(.*?).(\d+?).pid/.match(filename)
				if match
					host = match.captures[0]
					pid = match.captures[1].to_i
					type = File.read(File.join(pids_directory, filename)).chomp

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

	# Path to PID file for the given PID on local machine.
	# @param [Fixnum] PID of process.
	# @return [String] path to PID file.
	def pid_file(pid)
		File.join(File.dirname(__FILE__), "../../tmp/pids/import", "#{Socket.gethostname}-#{pid}.pid")
	end

end
