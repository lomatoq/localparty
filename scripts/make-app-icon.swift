// Original vector artwork for the iPhone app icon. Run from the repository root.
import AppKit
let size = 1024
let bitmap = NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:size,pixelsHigh:size,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep:bitmap)
let dark = NSColor(srgbRed:0.045,green:0.085,blue:0.058,alpha:1)
let lime = NSColor(srgbRed:0.74,green:0.96,blue:0.39,alpha:1)
NSGradient(starting:NSColor(srgbRed:0.11,green:0.19,blue:0.13,alpha:1),ending:dark)!.draw(in:NSRect(x:0,y:0,width:size,height:size),angle:270)
let pad = NSBezierPath()
pad.move(to:NSPoint(x:353,y:638))
pad.curve(to:NSPoint(x:215,y:506),controlPoint1:NSPoint(x:278,y:638),controlPoint2:NSPoint(x:231,y:581))
pad.line(to:NSPoint(x:162,y:319))
pad.curve(to:NSPoint(x:278,y:227),controlPoint1:NSPoint(x:130,y:205),controlPoint2:NSPoint(x:235,y:173))
pad.line(to:NSPoint(x:393,y:353))
pad.line(to:NSPoint(x:631,y:353))
pad.line(to:NSPoint(x:746,y:227))
pad.curve(to:NSPoint(x:862,y:319),controlPoint1:NSPoint(x:789,y:173),controlPoint2:NSPoint(x:894,y:205))
pad.line(to:NSPoint(x:809,y:506))
pad.curve(to:NSPoint(x:671,y:638),controlPoint1:NSPoint(x:793,y:581),controlPoint2:NSPoint(x:746,y:638))
pad.close()
lime.setFill();pad.fill()
dark.setFill()
NSBezierPath(roundedRect:NSRect(x:290,y:457,width:154,height:48),xRadius:13,yRadius:13).fill()
NSBezierPath(roundedRect:NSRect(x:343,y:404,width:48,height:154),xRadius:13,yRadius:13).fill()
NSBezierPath(ovalIn:NSRect(x:644,y:500,width:62,height:62)).fill()
NSBezierPath(ovalIn:NSRect(x:706,y:417,width:62,height:62)).fill()
// The Wi-Fi mark distinguishes the local multiplayer server from an ordinary game.
lime.setStroke()
for radius:CGFloat in [112,184] {
 let arc=NSBezierPath();arc.lineWidth=35;arc.lineCapStyle = .round
 arc.appendArc(withCenter:NSPoint(x:512,y:691),radius:radius,startAngle:43,endAngle:137)
 arc.stroke()
}
lime.setFill();NSBezierPath(ovalIn:NSRect(x:493,y:700,width:38,height:38)).fill()
NSGraphicsContext.restoreGraphicsState()
let url=URL(fileURLWithPath:"ios/LocalParty/Assets.xcassets/AppIcon.appiconset/AppIcon.png")
let opaque = CGContext(data:nil,width:size,height:size,bitsPerComponent:8,bytesPerRow:0,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.noneSkipLast.rawValue)!
opaque.draw(bitmap.cgImage!,in:CGRect(x:0,y:0,width:size,height:size))
try NSBitmapImageRep(cgImage:opaque.makeImage()!).representation(using:.png,properties:[:])!.write(to:url)
