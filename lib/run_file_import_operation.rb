
import_id = Integer(ARGV[first]) rescue nil

if import_id.nil?
	$stderr.puts "No import operation ID given"
	exit
end

import = ImportOperation.find_by_id(import_id)
if import.nil?
	$stderr.puts "Import operation with ID #{import_id} does not exist"
	exit
end

# TODO: Use data mapping to transform line into activity
#
# mapping = import.data_source.data_mapping
#
# file_path = import.data_source.file_data_source_file.path
# f = File.open(file_path, 'r')
# if f.nil?
#    import.error = "Unable to open file #{file_path}"
# else
#
#    f.each_with_index do |line, line_number|
#
#       begin
#          activity = mapping.process_line(line, line_number)
#          import.dataset.add_activity(activity)
#       rescue
#          import.error = "Error parsing file on line #{line_number}"
#          break
#       end
#    end
#
# end
#
# import.time_stopped = DateTime.now
# import.save
