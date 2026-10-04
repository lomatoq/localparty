#!/usr/bin/env ruby
# Generates a distribution project; the normal local host build stays unchanged.
require 'xcodeproj'
require 'fileutils'
require 'optparse'
root = File.expand_path('..', __dir__)
options = {bundle: 'com.localparty.launcher', live: false}
OptionParser.new do |p|
  p.on('--bundle ID') { |v| options[:bundle] = v }
  p.on('--team ID') { |v| options[:team] = v }
  p.on('--live', 'Enable QR only AFTER the published App Clip experience is verified') { options[:live] = true }
end.parse!
abort 'Invalid bundle identifier' unless options[:bundle].match?(/\A[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+\z/)
abort 'Pass your paid Apple Developer --team ID' unless options[:team]&.match?(/\A[A-Z0-9]{10}\z/)
project = Xcodeproj::Project.open(File.join(root, 'ios/LocalParty.xcodeproj'))
host = project.targets.find { |t| t.name == 'LocalParty' }
clip = project.targets.find { |t| t.name == 'HeyPalsJoin' }
abort 'Missing App Clip target' unless host && clip
host.add_dependency(clip)
embed = host.new_copy_files_build_phase('Embed App Clips')
embed.dst_subfolder_spec = '16'
embed.dst_path = '$(CONTENTS_FOLDER_PATH)/AppClips'
file = embed.add_file_reference(clip.product_reference)
file.settings = {'ATTRIBUTES' => ['RemoveHeadersOnCopy']}
entitlements = File.join(root, 'ios/LocalParty/AppClipHost.entitlements')
File.write(entitlements, <<~XML)
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0"><dict>
  <key>com.apple.developer.associated-appclip-app-identifiers</key>
  <array><string>$(AppIdentifierPrefix)#{options[:bundle]}.Join</string></array>
  <key>com.apple.developer.networking.HotspotConfiguration</key><true/>
  <key>com.apple.developer.networking.wifi-info</key><true/>
  </dict></plist>
XML
info = Xcodeproj::Plist.read_from_path(File.join(root, 'ios/LocalParty/Info.plist'))
info['HPAppClipLive'] = options[:live]
info['HPAppClipLink'] = "https://appclip.apple.com/id?p=#{options[:bundle]}.Join"
Xcodeproj::Plist.write_to_path(info, File.join(root, 'ios/LocalParty/AppClipHost-Info.plist'))
host.build_configurations.each do |c|
  c.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = options[:bundle]
  c.build_settings['INFOPLIST_FILE'] = 'LocalParty/AppClipHost-Info.plist'
  c.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'LocalParty/AppClipHost.entitlements'
  c.build_settings['DEVELOPMENT_TEAM'] = options[:team]
end
clip.build_configurations.each do |c|
  c.build_settings['HP_PARENT_BUNDLE_IDENTIFIER'] = options[:bundle]
  c.build_settings['DEVELOPMENT_TEAM'] = options[:team]
end
out = File.join(root, 'ios/LocalParty-AppClip.xcodeproj')
project.save(out)
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(host); scheme.set_launch_target(host)
scheme.save_as(out, 'LocalParty', true)
# Xcodeproj retains the original container when saving a copy; fix scheme references.
scheme_path = File.join(out, 'xcshareddata/xcschemes/LocalParty.xcscheme')
File.write(scheme_path, File.read(scheme_path).gsub('container:LocalParty.xcodeproj', 'container:LocalParty-AppClip.xcodeproj'))
puts "Created #{out} (one-scan QR #{options[:live] ? 'enabled' : 'disabled pending activation'})"
