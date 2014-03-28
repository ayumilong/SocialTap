module Import
module Source

class FileSource < BaseSource

	# Check that file exists and is readable.
	def self.validate_spec(spec)
		File.file?(spec['path']) && File.readable?(spec['path'])
	end

	# Read and parse lines from file.
	def each_doc
		File.open(@spec['path']).each do |line|
			line.chomp!
			unless line.empty?
				doc = JSON.parse(line)
				yield doc
			end
		end
	end

end

end
end
