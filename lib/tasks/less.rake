# Compile .less files in public/app/resources/less to CSS

SocialTap::Application.config.less.relativeUrls = false

desc "Compile .less files in public/app/resources/less to CSS"
task :less do
  assets = Sprockets::Environment.new
  assets.append_path "public/app/resources/less"
  assets["application.css"].write_to "public/app/resources/css/application.css"
end
