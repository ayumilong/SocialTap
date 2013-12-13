require "csv"

class CsvDataMapping < DataMapping

  def process(path)
    begin
      CSV.parse(path, {
        col_sep: options["col_sep"],
        quote_char: options["quote_char"],
        row_sep: :auto,
        headers: :first_row,
        return_headers: false
      }).each do |row|
        yield row.to_hash
      end
    rescue CSV::MalformedCSVError
      @on_error.call("Unable to parse CSV")
    end
  end

end
