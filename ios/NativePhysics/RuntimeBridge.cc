#include <node.h>
#include <v8.h>
#include <cmath>
extern "C" void LPReportServerActivity(unsigned long long units, bool running);
static void Report(const v8::FunctionCallbackInfo<v8::Value>& args) {
  auto context=args.GetIsolate()->GetCurrentContext();
  const double units=args.Length()>0?args[0]->NumberValue(context).FromMaybe(-1):-1;
  if(!std::isfinite(units)||units<0||units>9007199254740991.0)return;
  LPReportServerActivity(static_cast<unsigned long long>(units),args.Length()>1&&args[1]->BooleanValue(args.GetIsolate()));
}
static void Init(v8::Local<v8::Object> exports,v8::Local<v8::Value>,v8::Local<v8::Context> context,void*) {
  exports->Set(context,v8::String::NewFromUtf8Literal(context->GetIsolate(),"reportProgress"),v8::Function::New(context,Report).ToLocalChecked()).Check();
}
NODE_MODULE_LINKED(localparty_runtime,Init)
