class SessionsController < ApplicationController

	# GET /sessions/create
	def create

		auth = env['omniauth.auth']
		if auth[:provider] == 'identity'
			identity = Identity.find_by_id(auth[:uid])

		else
			identity = ProviderIdentity.where(provider: auth[:provider], uid: auth[:uid]).limit(1).first
			if identity.nil?
				identity = ProviderIdentity.create(provider: auth[:provider], uid: auth[:uid])
			end
		end

		if signed_in?
			if identity.user.present? && identity.user.id != current_user.id
				current_user.merge(identity.user)
			else
				identity.user = current_user
				identity.save
			end
		else
			if identity.user.blank?
				identity.user = User.create(name: auth[:info][:name])
				identity.save
			end
			self.current_user = identity.user
		end

		if env['omniauth.auth'][:provider] == 'identity'
			render json: session, status: :created
		else
			redirect_to '/'
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
