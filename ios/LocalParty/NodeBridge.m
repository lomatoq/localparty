#import "NodeBridge.h"
#import <NodeMobile/NodeMobile.h>
#import <stdatomic.h>
static _Atomic(unsigned long long) workUnits = 0;
static atomic_bool serverExecuting = false;
void LPReportServerActivity(unsigned long long units, bool running) {
    atomic_store(&workUnits,units); atomic_store(&serverExecuting,running);
}
@implementation NodeBridge
+ (unsigned long long)serverWorkUnits { return atomic_load(&workUnits); }
+ (BOOL)serverExecuting { return atomic_load(&serverExecuting); }
+ (void)startServer:(NSString *)script configuration:(NSString *)configuration {
    static dispatch_once_t once;
    dispatch_once(&once, ^{
        [NSThread detachNewThreadWithBlock:^{
            @autoreleasepool {
                [NSThread currentThread].qualityOfService = NSQualityOfServiceUserInitiated;
                NSArray *args = @[@"node", @"--jitless", @"--no-experimental-fetch", script, configuration];
                // Node requires contiguous argv storage and owns it for the runtime lifetime.
                size_t length = 0; for (NSString *arg in args) length += strlen(arg.UTF8String) + 1;
                char *storage = malloc(length); char **argv = calloc(args.count + 1, sizeof(char *));
                char *cursor = storage;
                for (NSUInteger i = 0; i < args.count; i++) { const char *value = [args[i] UTF8String]; argv[i] = cursor; strcpy(cursor, value); cursor += strlen(value) + 1; }
                node_start((int)args.count, argv);
                free(argv); free(storage);
            }
        }];
    });
}
@end
