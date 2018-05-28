const fs = require("fs");

// https://github.com/mathiasbynens/mothereff.in/blob/master/js-variables/eff.js#L83
const regexES6ReservedWord = /^(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|await|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$/;
// Use simple rule instead of complex one
const regexIdentifier = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;

function filterErrorsInNamedExport(locals) {
  return Object.keys(locals).reduce((acc, key) => {
    if (regexES6ReservedWord.test(key)) {
      acc.push(key + " is a reserved name");
    } else if (!regexIdentifier.test(key)) {
      acc.push(key + " is an invalid name");
    }
    return acc;
  }, []);
}

function writeFile(path, content) {
  fs.stat(path, function(err) {
    if (err) {
      fs.writeFile(path, content, function() {});
    } else {
      fs.readFile(path, "utf-8", function(err, data) {
        if (data !== content) {
          fs.writeFile(path, content, function() {});
        }
      });
    }
  });
}

module.exports = {
  filterErrors: filterErrorsInNamedExport,
  writeFile: writeFile
};
