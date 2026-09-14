#import <Foundation/Foundation.h>
@interface NodeBridge : NSObject
+ (void)startServer:(NSString *)script configuration:(NSString *)configuration;
+ (unsigned long long)serverWorkUnits;
+ (BOOL)serverExecuting;
@end
