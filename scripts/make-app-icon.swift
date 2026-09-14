// Build the native icon from the same branding source used by the web app.
import AppKit
let source = NSImage(contentsOfFile: "sources/localparty-app-icon-source.png")!
let size = 1024
let bitmap = NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:size,pixelsHigh:size,bitsPerSample:8,samplesPerPixel:3,hasAlpha:false,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep:bitmap)
NSColor(srgbRed:200/255,green:1,blue:46/255,alpha:1).setFill()
NSRect(x:0,y:0,width:size,height:size).fill()
source.draw(in:NSRect(x:0,y:0,width:size,height:size))
NSGraphicsContext.restoreGraphicsState()
try bitmap.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:"ios/LocalParty/Assets.xcassets/AppIcon.appiconset/AppIcon.png"))
