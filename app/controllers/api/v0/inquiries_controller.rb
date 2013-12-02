class Api::V0::InquiriesController < ApplicationController
  # GET /api/v0/inquiries
  # GET /api/v0/inquiries.json
  def index
    @inquiries = Inquiry.all

    render json: @inquiries
  end

  # GET /api/v0/inquiries/1
  # GET /api/v0/inquiries/1.json
  def show
    @inquiry = Inquiry.find(params[:id])

    render json: @inquiry
  end

  # POST /api/v0/inquiries
  # POST /api/v0/inquiries.json
  def create
    @inquiry = Inquiry.new(params[:inquiry])

    if @inquiry.save
      render json: @inquiry, status: :created, location: [:api, :v0, @inquiry]
    else
      render json: @inquiry.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v0/inquiries/1
  # PATCH/PUT /api/v0/inquiries/1.json
  def update
    @inquiry = Inquiry.find(params[:id])

    if @inquiry.update(params[:inquiry])
      head :no_content
    else
      render json: @inquiry.errors, status: :unprocessable_entity
    end
  end

  # DELETE /api/v0/inquiries/1
  # DELETE /api/v0/inquiries/1.json
  def destroy
    @inquiry = Inquiry.find(params[:id])
    @inquiry.destroy

    head :no_content
  end
  
  # GET /api/v0/inquiries/1/search
  # GET /api/v0/inquiries/1/search.json
  def search
    @inquiry = Inquiry.find(params[:id])
    render json: @inquiry.search
  end
  
end
