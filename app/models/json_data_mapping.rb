require "json"

class JsonDataMapping < DataMapping

  def process(path)
    File.open(path).each_with_index do |line, index|
      begin
        item = JSON.parse(line)
        yield item
      rescue
        @on_error.call("Parse error on line #{index}")
      end
    end
  end

end
