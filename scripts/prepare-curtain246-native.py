#!/usr/bin/env python3
"""Prepare a minimal UIKit app around the verbatim production curtain class.
No SDK compile, simulator launch, project edits or device mutation is performed.
"""
import argparse, hashlib, json, plistlib, shutil
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--source',default='ios/LocalParty/ExternalDisplay.swift')
parser.add_argument('--output',default='.localparty-build/curtain246/native-harness')
args=parser.parse_args()
source=Path(args.source).read_text()
marker='@MainActor private final class PartyTVCurtain: UIView {'
assert source.count(marker)==1
curtain=source[source.index(marker):]
out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
probe=r'''
@MainActor private final class CurtainProbe: NSObject, UIWindowSceneDelegate {
    var window: UIWindow?
    private var observations: [[String: Any]] = []
    private var completions: [[String: Any]] = []
    private var origin = CACurrentMediaTime()
    private var canvas: UIView!
    private var reduced: Bool { UIAccessibility.isReduceMotionEnabled }
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        let controller = UIViewController(); controller.view.backgroundColor = .purple
        window.rootViewController = controller; window.makeKeyAndVisible()
        self.window = window; canvas = controller.view
        Task { await self.run() }
    }
    private func pause(_ milliseconds: UInt64) async { try? await Task.sleep(nanoseconds: milliseconds * 1_000_000) }
    private func pose(_ cover: UIView) -> [String: Double] {
        let panels = cover.layer.sublayers?.compactMap { $0 as? CAShapeLayer } ?? []
        let position: (CALayer) -> Double = { panel in
            ((panel.presentation() ?? panel).value(forKeyPath: "transform.translation.x") as? NSNumber)?.doubleValue ?? 0
        }
        return ["left": panels.first.map(position) ?? 0, "right": panels.last.map(position) ?? 0,
                "opacity": Double((cover.layer.presentation() ?? cover.layer).opacity),
                "width": Double(cover.bounds.width), "height": Double(cover.bounds.height)]
    }
    private func sample(_ label: String, _ cover: UIView) {
        observations.append(["case": label, "at": (CACurrentMediaTime()-origin)*1000, "pose": pose(cover), "attached": cover.superview != nil])
    }
    private func completion(_ label: String, _ cover: UIView, _ finished: Bool) {
        completions.append(["case": label, "at": (CACurrentMediaTime()-origin)*1000, "finished": finished, "pose": pose(cover), "attached": cover.superview != nil])
    }
    private func wait(_ label: String) async throws {
        for _ in 0..<160 {
            if completions.contains(where: { $0["case"] as? String == label }) { return }
            await pause(20)
        }
        throw NSError(domain: "Curtain246", code: 1, userInfo: [NSLocalizedDescriptionKey: "Completion timeout: " + label])
    }
    private func check(_ condition: Bool, _ message: String) throws {
        if !condition { throw NSError(domain: "Curtain246", code: 2, userInfo: [NSLocalizedDescriptionKey: message]) }
    }
    private func entry(_ label: String) -> [String: Any]? { completions.first { $0["case"] as? String == label } }
    private func publish(_ error: Error? = nil) {
        let result: [String: Any] = ["status": error == nil ? "passed" : "failed", "failure": error?.localizedDescription ?? "", "reduced": reduced,
                                   "observations": observations, "completions": completions,
                                   "method": "Verbatim production PartyTVCurtain on actual UIKit/CoreAnimation Simulator. Presentation-layer transforms, opacity, callbacks and ownership. This is not physical cast acceptance."]
        if let data = try? JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys]) {
            let destination = URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Documents/curtain246-native-proof.json")
            try? data.write(to: destination)
            print("CURTAIN246_RESULT " + String(data: data, encoding: .utf8)!.replacingOccurrences(of: "\n", with: " "))
            fflush(stdout)
        }
    }
    private func run() async {
        await pause(150); origin = CACurrentMediaTime()
        do {
            let cover = PartyTVCurtain(frame: canvas.bounds, initiallyOpen: true)
            canvas.addSubview(cover); cover.layoutIfNeeded(); sample("before-first-close", cover)
            cover.close(animated: true) { self.completion("first-close", cover, $0) }
            await pause(65); sample("closing-before-repeated-close", cover)
            cover.close(animated: true) { self.completion("repeated-close", cover, $0) }
            try check(entry("first-close") == nil && entry("repeated-close") == nil, "Repeated close acknowledged while shutter is moving")
            await pause(35); sample("closing-after-repeated-close", cover)
            try await wait("repeated-close")
            try check(entry("first-close")?["finished"] as? Bool == true && entry("repeated-close")?["finished"] as? Bool == true, "Both close callbacks must finish true")
            let closed = pose(cover)
            try check(abs(closed["left"]!) < 0.5 && abs(closed["right"]!) < 0.5 && closed["opacity"]! > 0.99, "Closed callback precedes actual covered pose")
            cover.open { self.completion("interrupted-open", cover, $0) }
            await pause(reduced ? 45 : 90); sample("opening-before-reverse", cover)
            let before = pose(cover)
            cover.close(animated: true) { self.completion("reverse-close", cover, $0) }
            sample("opening-after-reverse-call", cover)
            let after = pose(cover)
            try check(abs(before["left"]!-after["left"]!) < 3 && abs(before["right"]!-after["right"]!) < 3 && abs(before["opacity"]!-after["opacity"]!) < 0.05, "Reverse jumped from presented pose")
            try check(entry("interrupted-open")?["finished"] as? Bool == false, "Interrupted open must return false")
            try check(cover.superview === canvas, "Interrupted open removed the closing shutter")
            try await wait("reverse-close"); sample("reverse-closed", cover)
            try check(entry("reverse-close")?["finished"] as? Bool == true, "Reverse close did not finish")
            cover.open { self.completion("resize-open", cover, $0) }
            await pause(reduced ? 40 : 100); sample("opening-before-resize", cover)
            let resizeBefore = pose(cover)
            // Exercise the real CALayer bounds/position path with a changed receiver size.
            cover.frame = CGRect(x: 0, y: 0, width: canvas.bounds.width * 1.2, height: canvas.bounds.height+19)
            cover.setNeedsLayout(); cover.layoutIfNeeded(); sample("opening-after-resize", cover)
            let resizeAfter = pose(cover)
            try check(abs(resizeBefore["left"]!-resizeAfter["left"]!) < 3 && abs(resizeBefore["right"]!-resizeAfter["right"]!) < 3, "Resize changed live door translation")
            cover.open { self.completion("repeated-open", cover, $0) }
            try check(cover.superview === canvas, "Shutter removed before open completed")
            try await wait("repeated-open")
            try check(entry("resize-open")?["finished"] as? Bool == true && entry("repeated-open")?["finished"] as? Bool == true, "Repeated open completion ownership incorrect")
            let opened = pose(cover)
            if !reduced { try check(abs(opened["left"]!) >= opened["width"]! * 0.56 + 1 && abs(opened["right"]!) >= opened["width"]! * 0.56 + 1, "Enlarged receiver shutter removed before door geometry was fully outside") }
            try check(cover.superview == nil, "Completed open did not remove shutter")
            let cancelled = PartyTVCurtain(frame: canvas.bounds, initiallyOpen: true)
            canvas.addSubview(cancelled); cancelled.close(animated: true) { self.completion("disconnect-close", cancelled, $0) }
            await pause(50); cancelled.cancel(); cancelled.removeFromSuperview()
            try check(entry("disconnect-close")?["finished"] as? Bool == false, "Disconnect left a pending successful close reply")
            if reduced { try check(observations.allSatisfy { ($0["pose"] as? [String:Double])?["left"] == 0 }, "Reduced motion translated the doors") }
            publish()
        } catch { publish(error) }
    }
}
@MainActor private final class CurtainProbeAppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let configuration = UISceneConfiguration(name: "CurtainProbe", sessionRole: session.role)
        configuration.delegateClass = CurtainProbe.self
        return configuration
    }
}
@main private struct CurtainProbeMain {
    static func main() { UIApplicationMain(CommandLine.argc, CommandLine.unsafeArgv, nil, NSStringFromClass(CurtainProbeAppDelegate.self)) }
}
'''
(out/'Curtain246Probe.swift').write_text('import UIKit\nimport QuartzCore\n'+curtain+'\n'+probe)
app=out/'Curtain246Probe.app';app.mkdir(exist_ok=True)
info={'CFBundleIdentifier':'com.heypals.qa.curtain246','CFBundleName':'Curtain246Probe','CFBundleExecutable':'Curtain246Probe','CFBundlePackageType':'APPL','CFBundleVersion':'1','CFBundleShortVersionString':'1.0','LSRequiresIPhoneOS':True,'UIDeviceFamily':[1,2],'UILaunchScreen':{},'UIApplicationSceneManifest':{'UIApplicationSupportsMultipleScenes':False},'MinimumOSVersion':'18.0'}
(app/'Info.plist').write_bytes(plistlib.dumps(info))
asset=Path('public/assets/branding/heypals-logo.png')
resource=app/'Server/public/assets/branding';resource.mkdir(parents=True,exist_ok=True)
shutil.copyfile(asset,resource/asset.name)
(out/'source-proof.json').write_text(json.dumps({'source':str(Path(args.source).resolve()),'classSha256':hashlib.sha256(curtain.encode()).hexdigest(),'sourceSha256':hashlib.sha256(source.encode()).hexdigest(),'verbatim':True,'rootMustCompileAndRun':True},indent=2))
print(out)
