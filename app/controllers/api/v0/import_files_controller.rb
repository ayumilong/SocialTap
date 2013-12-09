class Api::V0::ImportFilesController < ApplicationController

	# GET /api/v0/import_files/path
	# GET /api/v0/import_files/path.json
	def path
		render json: {path: APP_CONFIG['data_files']['import_directory']}
	end

end
