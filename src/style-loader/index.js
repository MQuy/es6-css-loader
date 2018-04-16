const path = require("path");
const loaderUtils = require("loader-utils");
const validateOptions = require('schema-utils');
const fs = require('fs');
const NativeModule = require('module');
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin');

const exec = (loaderContext, code, filename) => {
  const module = new NativeModule(filename, loaderContext);
  module.paths = NativeModule._nodeModulePaths(loaderContext.context); // eslint-disable-line no-underscore-dangle
  module.filename = filename;
  module._compile(code, filename); // eslint-disable-line no-underscore-dangle
  return module.exports;
};

const findModuleById = (modules, id) => {
  for (const module of modules) {
    if (module.id === id) {
      return module;
    }
  }
  return null;
};

module.exports = function () {};

module.exports.pitch = function pitch(request) {
  const query = loaderUtils.getOptions(this) || {};
  const loaders = this.loaders.slice(this.loaderIndex + 1);
  this.addDependency(this.resourcePath);
  const childFilename = '*'; // eslint-disable-line no-path-concat
  const publicPath = typeof query.publicPath === 'string' ? query.publicPath : this._compilation.outputOptions.publicPath;
  const outputOptions = {
    filename: childFilename,
    publicPath
  };
  const childCompiler = this._compilation.createChildCompiler(`style-loader ${request}`, outputOptions);
  new LibraryTemplatePlugin(null, 'commonjs2').apply(childCompiler);
  new SingleEntryPlugin(this.context, `!!${request}`, 'style-loader').apply(childCompiler);

  let source;
  childCompiler.hooks.afterCompile.tap('style-loader', compilation => {
    source = compilation.assets[childFilename] && compilation.assets[childFilename].source();

    // Remove all chunk assets
    compilation.chunks.forEach((chunk) => {
      chunk.files.forEach((file) => {
        delete compilation.assets[file]; // eslint-disable-line no-param-reassign
      });
    });
  });

  const callback = this.async();
  childCompiler.runAsChild((err, entries, compilation) => {
    if (err) return callback(err);

    if (!source) {
      return callback(new Error("Didn't get a result from child compiler"));
		}

    let text;
    let locals;
    try {
      text = exec(this, source, request);
      locals = text && text.locals;
    } catch (e) {
      return callback(e);
    }
    let resultSource = '// extracted by style-loader';
    if (locals && typeof resultSource !== 'undefined') {
      resultSource += "\n" + Object.keys(locals).map(function(key) {
        return "export const " + key + " = " + JSON.stringify(locals[key]) + ";";
      }).join("\n");
    }


    return callback(null, template() + "\n" + resultSource);
	});

	function template() {
		var options = loaderUtils.getOptions(this) || {};

		validateOptions(require('./options.json'), options, 'Style Loader')

		options.hmr = typeof options.hmr === 'undefined' ? true : options.hmr;

		// The variable is needed, because the function should be inlined.
		// If is just stored it in options, JSON.stringify will quote
		// the function and it would be just a string at runtime
		var insertInto;

		if (typeof options.insertInto === "function") {
			insertInto = options.insertInto.toString();
		}

		// We need to check if it a string, or variable will be "undefined"
		// and the loader crashes
		if (typeof options.insertInto === "string") {
			insertInto = '"' + options.insertInto + '"';
		}

		var hmr = [
			// Hot Module Replacement,
			"if(module.hot) {",
			// When the styles change, update the <style> tags
			"	module.hot.accept(" + loaderUtils.stringifyRequest(this, "!!" + request) + ", function() {",
			"		var newContent = require(" + loaderUtils.stringifyRequest(this, "!!" + request) + ");",
			"",
			"		if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];",
			"",
			"		var locals = (function(a, b) {",
			"			var key, idx = 0;",
			"",
			"			for(key in a) {",
			"				if(!b || a[key] !== b[key]) return false;",
			"				idx++;",
			"			}",
			"",
			"			for(key in b) idx--;",
			"",
			"			return idx === 0;",
			"		}(content.locals, newContent.locals));",
			"",
			// This error is caught and not shown and causes a full reload
			"		if(!locals) throw new Error('Aborting CSS HMR due to changed css-modules locals.');",
			"",
			"		update(newContent);",
			"	});",
			"",
			// When the module is disposed, remove the <style> tags
			"	module.hot.dispose(function() { update(); });",
			"}"
		].join("\n");

		return [
			// Style Loader
			// Adds CSS to the DOM by adding a <style> tag
			"",
			// Load styles
			"var content = require(" + loaderUtils.stringifyRequest(this, "!!" + request) + ");",
			"",
			"if(typeof content === 'string') content = [[module.id, content, '']];",
			"",
			// Transform styles",
			"var transform;",
			"var insertInto;",
			"",
			options.transform ? "transform = require(" + loaderUtils.stringifyRequest(this, "!" + path.resolve(options.transform)) + ");" : "",
			 "",
			"var options = " + JSON.stringify(options),
			"",
			"options.transform = transform",
			"options.insertInto = " + insertInto + ";",
			"",
			// Add styles to the DOM
			"var update = require(" + loaderUtils.stringifyRequest(this, "!" + path.join(__dirname, "lib", "addStyles.js")) + ")(content, options);",
			"",
			options.hmr ? hmr : ""
		].join("\n");
	}
}