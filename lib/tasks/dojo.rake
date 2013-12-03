require 'curb'
require 'fileutils'
require 'json'

namespace :dojo do

	desc "Run Dojo Toolkit build"
	task :build, :tier do |t, args|
		args.with_defaults(:tier => 'production')

		def which?(cmd)
			exts = ENV['PATHEXT'] ? ENV['PATHEXT'].split(';') : ['']
			ENV['PATH'].split(File::PATH_SEPARATOR).each do |path|
				exts.each { |ext|
					exe = File.join(path, "#{cmd}#{ext}")
					return exe if File.executable? exe
				}
			end
			return false
		end

		src_dir = 'public'

		dist_dir = 'public_production'

		tools_dir = src_dir + '/util/buildscripts'

		loader_module = 'app/run'

		loader_conf = src_dir + '/' + loader_module + '.js'

		profile_dir = 'config/dojo_profiles'

		base_profile = profile_dir + '/base.profile.js'

		build_profile = profile_dir + '/app-' + args.tier + '.profile.js'

		# Check that node and java are installed
		if !which?('node') || !which?('java')
			fail "Need node.js and java to build"
		end

		# Check for Dojo tools
		if !File.directory?(tools_dir)
			fail 'Can\'t find Dojo build tools'
		end

		puts 'Generating profile...'
		puts build_profile

		if File.exist?(build_profile)
			File.delete(build_profile)
		end
		FileUtils.cp(base_profile, build_profile)
		result = `node #{profile_dir}/module_layers.js >> #{build_profile}`
		if !result.empty?
			puts 'Failed to create Dojo build profile'
			puts result
			fail
		end

		# Leave console logs
		if args.tier == 'development'
			File.open(build_profile, 'a') do |f|
				f.puts "profile.stripConsole = 'none';"
			end
		end

		puts 'Compiling Less...'
		Rake::Task['less'].invoke

		puts 'Deleting old files...'
		FileUtils.rm_rf(dist_dir)
		Dir.mkdir(dist_dir)

		# Copy the appropriate version of index.html
		puts 'Creating index.html...'
		`cat #{src_dir}/#{args.tier}.html | tr -d '\n' > #{dist_dir}/index.html`

		# Copy static resources, minify static JS files
		puts 'Copying static resources...'
		Dir.mkdir(dist_dir + '/static')
		Dir.foreach(src_dir + '/static') do |item|
			next if item == '.' or item == '..'

			if item.match(/\.js$/) && !item.match(/\.min\.js$/)
				# Minify JS files that aren't already minified
				result = `java -jar #{src_dir}/util/shrinksafe/shrinksafe.jar #{src_dir}/static/#{item} > #{dist_dir}/static/#{item} 2> /dev/null`

				# If minification fails, just copy it
				if !$?.success?
					puts "Warning: Failed to minify #{src_dir}/static/#{item}"
					FileUtils.cp(src_dir + '/static/' + item, dist_dir + '/static/' + item)
				end
			else
				# Copy other files
				FileUtils.cp(src_dir + '/static/' + item, dist_dir + '/static/' + item)
			end
		end

	    puts 'Running Dojo build...'
	    # The ../ on the releaseDir is because apparently the releaseDir path is relative to the base path in the profile?
	   	Kernel.system("node #{src_dir}/dojo/dojo.js load=build --require #{loader_conf} --profile #{build_profile} --releaseDir ../#{dist_dir}")

	end

	desc "Download Dojo packages"
	task :install, :version do |t, args|
		args.with_defaults(:version => "1.9.1")

		dojo_dir = File.join(".", "public", "dojo")
		dojox_dir = File.join(".", "public", "dojox")
		dijit_dir = File.join(".", "public", "dijit")
		util_dir = File.join(".", "public", "util")

		if !(File.directory?(dojo_dir) && File.directory?(dojox_dir) &&
		     File.directory?(dijit_dir) && File.directory?(util_dir))
			dojo_target = "dojo-release-#{args.version}-src"
			dojo_tarball = "#{dojo_target}.tar.gz"
			tarball_url = "http://download.dojotoolkit.org/release-#{args.version}/#{dojo_tarball}"
			puts "Downloading Dojo from #{tarball_url}"
			puts "This may take several minutes"
			curl = Curl::Easy.new("#{tarball_url}")
			curl.perform
			File.open(dojo_tarball, 'w:ascii-8bit') { |f| f.write curl.body_str }
			`tar -xvf #{dojo_tarball}`
			Dir.glob(File.join(".", dojo_target, '*')).each do |file|
    			FileUtils.mv(file, File.join(".", "public", File.basename(file)))
  			end
  			FileUtils.rm_rf(dojo_target)
  			File.delete(dojo_tarball)

		else
			puts "All Dojo dependencies already installed"
		end
	end

end
