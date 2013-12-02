class Api::V0::VizsController < ApplicationController
  # GET /api/v0/vizs
  # GET /api/v0/vizs.json
  def index
    @vizs = Viz.all

    render json: @vizs
  end

  # GET /api/v0/vizs/1
  # GET /api/v0/vizs/1.json
  def show
    @viz = Viz.find(params[:id])

    render json: @viz
  end

  # POST /api/v0/vizs
  # POST /api/v0/vizs.json
  def create
    @viz = Viz.new(params[:viz])

    if @viz.save
      render json: @viz, status: :created, location: [:api, :v0, @viz]
    else
      render json: @viz.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v0/vizs/1
  # PATCH/PUT /api/v0/vizs/1.json
  def update
    @viz = Viz.find(params[:id])

    if @viz.update(params[:viz])
      head :no_content
    else
      render json: @viz.errors, status: :unprocessable_entity
    end
  end

  # DELETE /api/v0/vizs/1
  # DELETE /api/v0/vizs/1.json
  def destroy
    @viz = Viz.find(params[:id])
    @viz.destroy

    head :no_content
  end
end
