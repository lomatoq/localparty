"""Explicit Wasm32 conversions; keep table loop indices as wide as their bounds."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]/'ios/NativePhysics'
for name in ['rapier2d.c','rapier3d.c']:
    p=root/name;s=p.read_text()
    s=s.replace('for (uint32_t i = d; i < d + n; i++)','for (uint64_t i = d; i < d + n; i++)')
    # Wasm memory.grow returns i32 (including -1), the generic runtime supports memory64.
    s=re.sub(r'(var_i[0-9]+ = )(wasm_rt_grow_memory\([^;]+\));',r'\1(u32)\2;',s)
    # Integer comparison results in Wasm are always i32 booleans, including i64 comparisons.
    s=re.sub(r'(var_i[0-9]+ = )\(u64\)(\(\(s64\)[^;]+);',r'\1(u32)\2;',s)
    p.write_text(s)
p=root/'wasm-rt-impl-tableops.inc';s=p.read_text()
# max_size was checked immediately before this assignment and is itself uint32_t.
s=s.replace('table->size = new_elems;', 'table->size = (uint32_t)new_elems;')
p.write_text(s)
