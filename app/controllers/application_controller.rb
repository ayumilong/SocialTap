class ApplicationController < ActionController::API

	private

	def current_user
		@current_user ||= User.find_by_id(session[:user_id])
	end

	def signed_in?
		!!current_user
	end

	def current_user=(user)
		session[:user_id] = user.nil? ? user : user.id
		logger.debug session
		@current_user = user
	end

end
