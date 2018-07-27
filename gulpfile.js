'use strict';

/**
* Generate themes folder from Drupal Version
*/

var themes_folder = 'web/themes';

/**
* Gulp specific config
*/

var path = {
    theme:  themes_folder + '/beaker/',
    sass:   'sass',
    css:    'css',
    js:     'js',
    img:    'images',
    tpl:    'templates',
    fonts:  'fonts'
};

/* Set paths */
path.sass   = path.theme + path.sass;
path.css    = path.theme + path.css;
path.js     = path.theme + path.js;
path.img    = path.theme + path.img;
path.tpl    = path.theme + path.tpl;
path.fonts  = path.theme + path.fonts;

var gulp          = require('gulp'),
    util          = require('gulp-util'),
    sass          = require('gulp-sass'),
    globbing      = require('gulp-css-globbing'),
    postcss       = require('gulp-postcss'),
    autoprefixer  = require('autoprefixer'),
    mqpacker      = require('css-mqpacker'),
    csswring      = require('csswring');

/* Check local env */
var dev = util.env.env != 'prod' ? true : false;
var no_error_exit = false;

/* Development stuff, do NOT install on dev/prod */
if( dev ) {
  var browserSync   = require('browser-sync'),
      reload        = browserSync.reload,
      filter        = require('gulp-filter'),
      colors        = require('colors'),
      jshint        = require('gulp-jshint'),
      sourcemaps    = require('gulp-sourcemaps'),
      fs            = require('fs'),
      duration      = require('gulp-duration'),
      imagemin      = require('gulp-imagemin'),
      pngquant      = require('imagemin-pngquant'),
      imageminSvgo  = require('imagemin-svgo'),
      iconfont      = require('gulp-iconfont'),
      runTimestamp  = Math.round(Date.now()/1000),
      yaml          = require('js-yaml'),
      stylelint     = require('gulp-stylelint');

  /* Docker setup */
  if( fs.existsSync('./docker-compose.yml') ) {
    var get_hostname     = yaml.safeLoad(fs.readFileSync('./docker-compose.yml', 'utf8'));
    var domain           = get_hostname['services']['drupal']['hostname'];
  }
  /* Vagrant locally */
  else if( fs.existsSync('./domain.json') ) {
    var domain        = require('./domain.json');
  }
  /* Exit */
  else {
    exit();
  }
}


/* Gulp Sass dev compile task */
gulp.task('sass', function () {
  var processors = [
        autoprefixer({browsers: ['last 10 versions', 'ie 10']})
      ],
      processors_prod = [
        autoprefixer({browsers: ['last 10 versions', 'ie 10']}),
        csswring
      ],
      processors = dev ? processors : processors_prod;

  gulp.src(path.sass + '/**/*.scss')
    // .pipe(stylelint({
    //   fix: true,
    //   reporters: [
    //     {formatter: 'string', console: true}
    //   ]
    // }))
    .pipe(dev ? sourcemaps.init() : util.noop())
    .pipe(globbing({ extensions: ['.scss'] }))
    .pipe(no_error_exit ? sass.sync().on('error', sass.logError) : sass.sync().on('error', sass.logError).on('error', process.exit.bind(process, 1)))
    .pipe(postcss(processors))
    .pipe(dev ? duration('postCSS finished') : util.noop())
    .pipe(util.env.env != 'prod' ? sourcemaps.write('./map') : util.noop())
    .pipe(dev ? duration('created sourcemap files') : util.noop())
    .pipe(gulp.dest('./' + path.css))
    .pipe(dev ? filter([path.css + '/**/*.css', '!' + path.css + '/animate.css']) : util.noop())
    .pipe(dev ? browserSync.reload({stream: true}) : util.noop())
    .pipe(dev ? filter([path.css + '/**/*.css', '!' + path.css + '/animate.css']) : util.noop())
    .pipe(dev ? duration('moved all files to /css folder') : util.noop());
});


/* Gulp browserSync init task */
gulp.task('browser-sync', function() {
  var vghostmode = false;
  var vopen = false;

  if(util.env.ghostmode) {
    var vghostmode = true;
  }
  if(util.env.open) {
    var vopen = true;
  }

  return browserSync.init(null, {
    proxy: domain,
    startPath: "",
    files: path.css + '/*.css',
    open: vopen,
    notify: false,
    logConnections: true,
    reloadOnRestart: true,
    injectChanges: true,
    ghostMode: {
      clicks: vghostmode,
      forms: vghostmode,
      scroll: vghostmode
    }
  });
});


/* Gulp Image optimization task */
gulp.task('images', function() {
    return gulp.src(path.theme + '/**/*.{png,gif,jpg,jpeg,svg}')
    .pipe(imagemin({
        progressive: true,
        interlaced: true,
        multipass: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    }))
    .pipe(imageminSvgo()())
    .pipe(gulp.dest(path.theme + '/'));
});


/* SVG Minify */
gulp.task('svg', function() {
  return gulp.src(path.img + '/**/*.svg')
  .pipe(imagemin({
      progressive: true,
      interlaced: true,
      multipass: true,
      svgoPlugins: [{removeViewBox: false}]
  }))
  .pipe(imageminSvgo()())
  .pipe(gulp.dest(path.img + '/'))
  .pipe(duration('minified SVGs'));
});


/* Gulp generate iconfont from SVGs */
gulp.task('iconfont', function(){
  return gulp.src([path.img + '/iconfont/*.svg'])
    .pipe(iconfont({
      fontName: 'iconfont',
      prependUnicode: true,
      formats: ['ttf', 'eot', 'woff', 'svg', 'woff2'],
      timestamp: runTimestamp,
      normalize: true,
      fixedWith: 25,
      fontHeight: 1000
    }))
      .on('glyphs', function(glyphs, options) {
        console.log(glyphs, options);
      })
    .pipe(gulp.dest(path.fonts + '/'));
});


/* Gulp jshint task */
gulp.task('jshint', function() {
  return gulp.src(path.js + '/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

/* Gulp Sass lint task */
gulp.task('lint-sass', function() {
  return gulp
    .src(path.sass + '/**/*.scss')
    .pipe(stylelint({
      fix: true,
      reporters: [
        {formatter: 'string', console: true}
      ]
    }))
    .pipe(gulp.dest(path.sass + '/'));
});


/* Gulp browserSync init task */
gulp.task('watch', ['browser-sync'], function () {
    no_error_exit = true;
    gulp.watch(path.sass + '/**/*.scss', ['sass']);
    gulp.watch(path.js + '/**/*.js').on('change', reload);
    gulp.watch("*.html").on('change', reload);
    gulp.watch(path.tpl + '/**/*.html.twig').on('change', reload);
    gulp.watch(path.tpl + '/**/*.tpl.php').on('change', reload);
    gulp.watch(path.img + '/**/*.svg', ['svg']);
});


/* Default task */
gulp.task('default', ['watch']);
/* Gulp compile task for local/dev/prod env with args */
gulp.task('compile', ['sass']);


/* Help task */
gulp.task('help', function () {
  console.log("\n\nUsage".underline);
  console.log("  gulp [command] --option\n\n"+"Commands:".underline);
  console.log('gulp watch'.yellow+'\t\t\trun with browserSync extension');
  console.log('gulp compile'.yellow+'\t\t\tcompile Sass for development enviroment');
  console.log('gulp compile --env=prod'.yellow+'\t\tcompile Sass for production enviroment');
  console.log('gulp svg'.yellow+'\t\t\trun Optimizes SVGs in beaker (image folder only)');
  console.log('gulp images'.yellow+'\t\t\trun Optimizes Images in beaker');
  console.log('gulp jshint'.yellow+'\t\t\ttool that helps to detect errors & problems');
  console.log('gulp lint-sass'.yellow+'\t\t\tlint and autofix Sass code');
  console.log('gulp iconfont'.yellow+'\t\t\tGenerate Iconfont from images/iconfont folder (SVG only)');
  console.log("\nOptions for watch task:".underline);
  console.log("\n  --ghostmode\t\t\tsyncs clicks,scroll,forms across browsers");
  console.log("  --open\t\t\topen site in browser\n\n");
});
