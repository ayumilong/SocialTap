# Include in ActiveRecord classes to raise an exception when a readonly attribute is modified.
module EnforceReadonlyAttributes

	class ReadonlyAttributeError < StandardError
	end

	def self.included(parent_class)

		# Modify the class this module was included in.
		parent_class.class_eval do

			# Override attr_readonly class method.
			def self.attr_readonly(*attributes)
				super

				# For each attribute declared readonly, override its setter to raise an exception
				# if the record has already been persisted.
				attributes.each do |attr|
					self.class_eval %Q"
						def #{attr}=(value)
							if !persisted?
								super
							else
								raise ReadonlyAttributeError, 'Attempt to modify readonly attribute #{attr} on #{self.name}'
							end
						end
					"
				end
			end
		end
	end

end
