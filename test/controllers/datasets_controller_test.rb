require 'test_helper'

class DatasetsControllerTest < ActionController::TestCase
  setup do
    @dataset = datasets(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:datasets)
  end

  test "should create dataset" do
    assert_difference('Dataset.count') do
      post :create, dataset: {  }
    end

    assert_response 201
  end

  test "should show dataset" do
    get :show, id: @dataset
    assert_response :success
  end

  test "should update dataset" do
    put :update, id: @dataset, dataset: {  }
    assert_response 204
  end

  test "should destroy dataset" do
    assert_difference('Dataset.count', -1) do
      delete :destroy, id: @dataset
    end

    assert_response 204
  end
end
