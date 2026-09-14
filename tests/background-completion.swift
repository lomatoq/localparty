import Foundation
final class Counter: @unchecked Sendable {
    private let lock=NSLock();private var storage=0
    func add(){lock.lock();storage+=1;lock.unlock()}
    var value:Int {lock.lock();defer{lock.unlock()};return storage}
}
@main struct CompletionTests {
 static func main(){
    for _ in 0..<100 {
      let calls=Counter(),updates=Counter()
      let task=BackgroundTaskCompletion {calls.add()}
      DispatchQueue.concurrentPerform(iterations:200){i in
        if i % 3 == 0 {task.finish()} else {task.update {updates.add()}}
      }
      task.finish();let before=updates.value
      task.update {updates.add()}
      precondition(calls.value==1 && updates.value==before && task.isFinished)
    }
    let oldCount=Counter(),newCount=Counter()
    let old=BackgroundTaskCompletion {oldCount.add()},new=BackgroundTaskCompletion {newCount.add()}
    old.finish();old.finish();precondition(!new.isFinished && newCount.value==0)
    new.finish();precondition(oldCount.value==1 && newCount.value==1)
    print("PASS: 100 concurrent Stop/expiration/progress races; completion exactly once; no progress after completion; old task cannot complete a new task")
 }
}
