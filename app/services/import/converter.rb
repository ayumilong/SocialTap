module Import
module Converter

	@@conversions = nil

	# Get list of available format conversions.
	# @return [Array] Array of conversions. Each element is { from: format_name, to: format_name }
	def self.available_conversions
		if @@conversions.nil?
			@@conversions = Array.new
			conversions_dir = File.join(File.dirname(__FILE__), "converter")
			Dir.foreach(conversions_dir) do |filename|
				next if filename == "." || filename == ".."

				filename.chomp!(".rb")
				in_format, out_format = *filename.split("_to_")
				@@conversions.push({ :from => in_format, :to => out_format })
			end
		end

		@@conversions
	end

end
end
