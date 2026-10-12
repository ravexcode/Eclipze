const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadTypeScript(relativePath, { mocks = {}, globals = {} } = {}) {
  const root = path.resolve(__dirname, "../..");
  const modules = new Map();

  function load(filename) {
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const localRequire = name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === "server-only") return {};
      if (name.startsWith("@/")) {
        const base = path.join(root, "src", name.slice(2));
        const resolved = [base + ".ts", base + ".tsx", path.join(base, "index.ts")].find(fs.existsSync);
        if (!resolved) throw new Error(`Cannot resolve ${name}`);
        return load(resolved);
      }
      return require(name);
    };
    const context = vm.createContext({
      console, URL, Request, Response, Headers, Event, AbortController,
      setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
      ...globals, module, exports: module.exports, require: localRequire,
    });
    new vm.Script(source, { filename }).runInContext(context);
    return module.exports;
  }

  return load(path.resolve(root, relativePath));
}

module.exports = { loadTypeScript };
