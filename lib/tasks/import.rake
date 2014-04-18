require File.join(File.dirname(__FILE__), '../../app/services/import/worker_manager')

namespace :import do
	desc "Start import worker processes"
	task :start, [:type, :number] do |t, args|
		args.with_defaults({ type: 'file', number: 1 })

		puts "Starting #{args[:number]} #{args[:type]} worker#{args[:number].to_i > 1 ? "s" : ""}..."

		worker_manager = Import::WorkerManager.instance

		args[:number].to_i.times do |i|
			worker_pid = worker_manager.start_worker(args[:type])
			puts "#{worker_pid}"
		end
	end

	desc "Lists import worker processes"
	task :list do

		worker_processes = Hash.new
		Import::WorkerManager.instance.all_worker_processes.each do |p|
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

	desc "Stop an import worker processes"
	task :stop, [:pid] do |t, args|

		worker_manager = Import::WorkerManager.instance

		if args[:pid].nil?
			worker_manager.stop_all_local_workers
		else
			begin
				pid = Integer(args[:pid])
				if worker_manager.process_is_worker?(pid)
					worker_manager.stop_workers([pid])
				else
					$stderr.puts "Process #{args[:pid]} is not an import worker"
					exit
				end
			rescue ArgumentError
				$stderr.puts "PID must be numeric"
				exit(false)
			end
		end

	end

	desc "Remove orphaned PID files"
	task :refresh do
		Import::WorkerManager.instance.refresh_local_pid_files
	end

end
