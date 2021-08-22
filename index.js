import wasmBuffer from './optimized.wasm.js'
const compiled = new WebAssembly.Module(wasmBuffer)
const wasmModule = new WebAssembly.Instance(compiled, {})
export default wasmModule.exports
