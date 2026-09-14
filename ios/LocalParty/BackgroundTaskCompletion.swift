import Foundation

// The progress queue, expiration callback and UI Stop can arrive concurrently.
// Complete each OS task exactly once and never update its Progress afterwards.
final class BackgroundTaskCompletion: @unchecked Sendable {
    private let lock=NSLock()
    private var done=false
    private let complete:()->Void
    init(_ complete:@escaping ()->Void) {self.complete=complete}
    var isFinished:Bool {lock.lock();defer {lock.unlock()};return done}
    func update(_ action:()->Void) {lock.lock();defer {lock.unlock()};if !done {action()}}
    func finish() {lock.lock();if done {lock.unlock();return};done=true;lock.unlock();complete()}
}
