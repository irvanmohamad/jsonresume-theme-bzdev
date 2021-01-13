var fs = require("fs");
var path = require('path');
var Handlebars = require("handlebars");
var utils = require('handlebars-utils');
var marked = require('marked');

Handlebars.registerHelper('markdown', function (str, locals, options) {
  if (typeof str !== 'string') {
    options = locals;
    locals = str;
    str = true;
  }

  if (utils.isOptions(locals)) {
    options = locals;
    locals = {};
  }

  var ctx = utils.context(this, locals, options);
  var val = utils.value(str, ctx, options);

  var markup = marked(val);

  // If we end up with a string wrapped in one <p> block, remove it so we don't create a new text block
  var startEndMatch = markup.match(/^<p>(.*)<\/p>\n$/);
  return startEndMatch && startEndMatch[1].indexOf("<p>") === -1 ?
    startEndMatch[1] :
    markup;
});

Handlebars.registerHelper('displayUrl', function (str) {
  return str.replace(/https?:\/\//, "");
});

Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});


Handlebars.registerHelper('monthYear', function (str) {
  if (str) {
    var d = new Date(str);
    return d.toLocaleString('id-ID', {month: 'short'}) + " " + d.getFullYear();
  } else {
    return "Sekarang"
  }
});

Handlebars.registerHelper('year', function (str) {
  if (str) {
    var d = new Date(str);
    return d.getFullYear();
  } else {
    return "Sekarang"
  }
});

Handlebars.registerHelper('award', function (str) {
  switch (str.toLowerCase()) {
    case "bachelor":
    case "master":
      return str + "s";
    default:
      return str;
  }
});

Handlebars.registerHelper('skillLevel', function (str) {
  switch (str.toLowerCase()) {
    case "beginner":
      return "25%";
    case "intermediate":
      return "50%";
    case "advanced":
      return "75%";
    case "master":
      return "100%";
    default:
      return parseInt(str) + "%"
  }
});

// Resume.json used to have website property in some entries.  This has been renamed to url.
// However the demo data still uses the website property so we will also support the "wrong" property name.
// Fix the resume object to use url property
function fixResume(resume) {
  if (resume.basics.website) {
    resume.basics.url = resume.basics.website;
    delete resume.basics.website
  }
  fixAllEntries(resume.work);
  fixAllEntries(resume.volunteer);
  fixAllEntries(resume.publications);
  fixAllEntries(resume.projects);

  fixWork(resume.work);
}

function fixAllEntries(entries) {
  if (entries) {
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (entry.website) {
        entry.url = entry.website;
        delete entry.website;
      }
    }
  }
}

// work.company has been renamed as work.name in v1.0.0
function fixWork(work) {
  if (work) {
    for (var i = 0; i < work.length; i++) {
      var entry = work[i];
      if (entry.company) {
        entry.name = entry.company;
        delete entry.website;
      }
    }

  }
}

function render(resume) {
  var css = fs.readFileSync(__dirname + "/assets/css/styles.css", "utf-8");
  var js = fs.readFileSync(__dirname + "/assets/js/main.js", "utf-8");
  var tpl = fs.readFileSync(__dirname + "/resume.hbs", "utf-8");

  fixResume(resume);

  const packageJSON = require("./package");
  return Handlebars.compile(tpl)({
    css: css,
    js: js,
    resume: resume,
    meta: {
      packageName: packageJSON.name,
      version: packageJSON.version
    }
  });
}

module.exports = {
  render: render
};