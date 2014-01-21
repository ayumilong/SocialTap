class SessionsController < ApplicationController

	# GET /sessions/create
	def create
		user = User.from_omniauth env['omniauth.auth']
		session[:user_id] = user.id
		render json: true, status: :created
	end

	# GET /sessions/destroy
	def destroy
		session[:user_id] = nil
		head :no_content
	end

	# GET /sessions/failure
	def failure
		render json: ({:error => params[:message]}.to_json), status: :unauthorized
	end

end
