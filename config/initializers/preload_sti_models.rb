if Rails.env.development?

	%w[data_source file_data_source gnip_data_source].each do |model|
		require_dependency File.join("app", "models", "#{model}.rb")
	end

end
