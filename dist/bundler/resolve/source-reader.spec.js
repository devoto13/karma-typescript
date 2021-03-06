"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var log4js = require("log4js");
var mock = require("mock-require");
var os = require("os");
var test = require("tape");
var readFileCallback = [undefined, new Buffer("")];
mock("fs", {
    readFile: function (filename, callback) {
        filename = filename;
        return callback.apply(void 0, readFileCallback);
    }
});
var configuration_1 = require("../../shared/configuration");
var project_1 = require("../../shared/project");
var bundle_item_1 = require("../bundle-item");
var transformer_1 = require("../transformer");
var source_reader_1 = require("./source-reader");
var configuration = new configuration_1.Configuration({});
var project = new project_1.Project(configuration, log4js.getLogger("project"));
var transformer = new transformer_1.Transformer(configuration, project);
var sourceReader = new source_reader_1.SourceReader(configuration, log4js.getLogger("sourceReader"), transformer);
var karmaTypescriptConfig = {
    bundlerOptions: {
        ignore: ["ignored"],
        noParse: ["noparse"]
    }
};
var karma = {};
karma.karmaTypescriptConfig = karmaTypescriptConfig;
configuration.initialize(karma);
test("source-reader should return an empty object literal for ignored modules", function (t) {
    t.plan(1);
    var bundleItem = new bundle_item_1.BundleItem("ignored", "ignored.js");
    sourceReader.read(bundleItem, function () {
        t.equal(bundleItem.source, "module.exports={};");
    });
});
test("source-reader should read source for module", function (t) {
    t.plan(1);
    readFileCallback = [undefined, new Buffer("var x;")];
    var bundleItem = new bundle_item_1.BundleItem("dummy", "dummy.js");
    sourceReader.read(bundleItem, function () {
        t.equal(bundleItem.source, "var x;");
    });
});
test("source-reader should create an AST", function (t) {
    t.plan(1);
    var bundleItem = new bundle_item_1.BundleItem("dummy", "dummy.js");
    sourceReader.read(bundleItem, function () {
        t.notEqual(bundleItem.ast.body, undefined);
    });
});
test("source-reader should create an empty dummy AST for non-script files (css, JSON...)", function (t) {
    t.plan(1);
    var bundleItem = new bundle_item_1.BundleItem("style", "style.css");
    sourceReader.read(bundleItem, function () {
        t.deepEqual(bundleItem.ast, {
            body: undefined,
            sourceType: "script",
            type: "Program"
        });
    });
});
test("source-reader should create an empty dummy AST for modules specified in the bundler option 'noParse'", function (t) {
    t.plan(1);
    var bundleItem = new bundle_item_1.BundleItem("noparse", "noparse.js");
    sourceReader.read(bundleItem, function () {
        t.deepEqual(bundleItem.ast, {
            body: undefined,
            sourceType: "script",
            type: "Program"
        });
    });
});
test("source-reader should prepend JSON source with 'module.exports ='", function (t) {
    t.plan(1);
    readFileCallback = [undefined, new Buffer(JSON.stringify([1, 2, 3, "a", "b", "c"]))];
    var bundleItem = new bundle_item_1.BundleItem("json", "json.json");
    sourceReader.read(bundleItem, function () {
        t.equal(bundleItem.source, os.EOL + "module.exports = [1,2,3,\"a\",\"b\",\"c\"];");
    });
});
test("source-reader should prepend stylesheet source (original CSS) with 'module.exports ='", function (t) {
    t.plan(1);
    readFileCallback = [undefined, new Buffer(".color { color: red; }")];
    var bundleItem = new bundle_item_1.BundleItem("style", "style.css");
    sourceReader.read(bundleItem, function () {
        t.equal(bundleItem.source, os.EOL + "module.exports = \".color { color: red; }\";");
    });
});
test("source-reader should prepend transformed stylesheet source (now JSON) with 'module.exports ='", function (t) {
    t.plan(1);
    readFileCallback = [undefined, new Buffer(JSON.stringify({ color: "_color_xkpkl_5" }))];
    var bundleItem = new bundle_item_1.BundleItem("transformed", "transformed.css");
    sourceReader.read(bundleItem, function () {
        t.equal(bundleItem.source, os.EOL + "module.exports = {\"color\":\"_color_xkpkl_5\"};");
    });
});
test("source-reader should not prepend redundant 'module.exports ='", function (t) {
    t.plan(1);
    readFileCallback = [undefined, new Buffer("module.exports = '';")];
    var bundleItem = new bundle_item_1.BundleItem("redundant", "redundant.css");
    sourceReader.read(bundleItem, function () {
        t.equal(bundleItem.source, "module.exports = '';");
    });
});
test("source-reader should prepend 'module.exports =' to valid javascript with non-script extension, css", function (t) {
    t.plan(1);
    readFileCallback = [undefined, new Buffer("{ color: '_color_xkpkl_5'; }")];
    var bundleItem = new bundle_item_1.BundleItem("valid-js", "valid-js.css");
    sourceReader.read(bundleItem, function () {
        t.equal(bundleItem.source, os.EOL + "module.exports = \"{ color: \'_color_xkpkl_5\'; }\";");
    });
});
test("source-reader should prepend 'module.exports =' to valid javascript with non-script extension, txt", function (t) {
    t.plan(1);
    readFileCallback = [undefined, new Buffer("(function() {return {foo: 'baz',bork: true}})();")];
    var bundleItem = new bundle_item_1.BundleItem("valid-js", "valid-js.txt");
    sourceReader.read(bundleItem, function () {
        t.equal(bundleItem.source, os.EOL + "module.exports = \"(function() {return {foo: \'baz\',bork: true}})();\";");
    });
});
