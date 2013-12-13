if Rails.env.development?

	%w[dataset file_dataset gnip_dataset].each do |model|
		require_dependency File.join("app", "models", "#{model}.rb")
	end

end
