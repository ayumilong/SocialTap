class SessionsController < ApplicationController

	# GET /sessions/create
	def create

		auth = env['omniauth.auth']

		# Login with email and password
		if auth[:provider] == 'identity'

			if signed_in?
				# Destroy the Identity created by OmniAuth if attempting to register a new
				# account while already logged in.
				identity = Identity.find_by_id(auth[:uid])
				identity.destroy if identity.user.nil?

				render json: { errors: ["You are already logged in"] }, status: :bad_request

			else
				# The Identity instance is automatically created by OmniAuth
				identity = Identity.find_by_id(auth[:uid])
				if identity.user.nil?
					logger.debug "Creating new user"
					identity.user = User.create(name: auth[:info][:name])
					identity.save
				end

				self.current_user = identity.user

				render json: true, status: :created
			end

		# Connect an OAuth account
		else
			if signed_in?

				# Prevent linking more than one Twitter account
				unless current_user.connected_accounts.select { |acct| acct.provider == auth[:provider] } .empty?
					cookies[:connect_account_already_connected] = true
					redirect_to '/#/', status: :bad_request
				end

				identity = ConnectedAccount.where(provider: auth[:provider], uid: auth[:uid]).limit(1).first
				if identity.nil?
					identity = ConnectedAccount.create({
						provider: auth[:provider],
						uid: auth[:uid],
						username: auth.info[:nickname],
						token: auth.credentials.token,
						secret: auth.credentials.secret,
						user: current_user
					})
				end
				redirect_to '/'
			else
				cookies[:connect_account_require_login] = true
				redirect_to '/#/auth/login', status: :unauthorized
			end
		end
	end

	# GET /sessions/destroy
	def destroy
		self.current_user = nil
		head :no_content
	end

	# GET /sessions/failure
	def failure
		render json: ({:error => params[:message]}.to_json), status: :unauthorized
	end

end
