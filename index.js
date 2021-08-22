import wasmBuffer from './optimized.wasm.js'
const compiled = new WebAssembly.Module(wasmBuffer)
export default function(imports) {
    // usually caller will provide something, but if not, fill in the minimum
    if (!imports) {
        imports = {env: {memory: new WebAssembly.Memory({initial: 1})}}
    }

    return new WebAssembly.Instance(compiled, imports).exports
}
