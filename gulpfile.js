var gulp = require('gulp'),
    sass = require('gulp-sass'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require("gulp-rename"),
    neat = require('node-neat').includePaths, // Add Bourbon Neat
    gcmq = require('gulp-group-css-media-queries'),
    sourcemaps = require('gulp-sourcemaps'),
    cssmin = require('gulp-cssmin'),
    modernizr = require('gulp-modernizr'),
    twig = require('gulp-twig'),
    data = require('gulp-data'),
    browserSync = require('browser-sync').create();

// Setup development paths
var source = {
  'assets': "content/assets",
  'src': "src",
  'server_root': "content",
  'templates': "src/twig"
};

// Static Server + watching SCSS, JS and Twig files
gulp.task('serve', [], function() {
  browserSync.init({
    server: {
      // proxy: "websiteurl.dev" // if using MAMP or other local server, use this setting.
      baseDir: source['server_root'] // if just servering static files use this setting.
    }
  });
  gulp.watch(source['src']+"/scss/**/*.scss", ['compile-css']);
  gulp.watch([source['src']+"/js/*.js","!js/*.min.js"], ['js-watch']);
  gulp.watch(source['templates']+"/**/*.twig",['compile-twig']).on('change', browserSync.reload);
});

// Compile the twig files, but only the main files—not the partials
gulp.task('compile-twig', function () {
  return gulp.src([
    source['templates']+'/index.twig'
  ])
    .pipe(twig({
      base: source['templates'],
      errorLogToConsole: true
    }))
    .pipe(gulp.dest(source['server_root']));
});

// Compile SASS into CSS, combine media queries, and minify the CSS file(s)
gulp.task('sass', function() {
  return gulp.src(source['src']+"/scss/*.scss")
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: ['styles'].concat(neat) // including Bourbon Neat
    }))
    // Handle errors different because I don't want to have to restart gulp every time...
    .on('error', function (error) {
      console.error('' + error);
      this.emit('end');
    })
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest(source['assets']+"/css"));
});
gulp.task('compile-css', ['sass'], function(){
  gulp.src(source['assets']+'/css/*.css')
    .pipe(gcmq()) // Combine media queries
    .pipe(cssmin()) // Minify things
    .pipe(gulp.dest(source['assets']+'/css'))
    .pipe(browserSync.stream());
});


// Compress those nasty js files
gulp.task('minify', function() {
  return gulp.src([
    '!'+source['src']+'/js/*.min.js',
    source['src']+'/js/**/*.js'
  ])
    .pipe(uglify({}))
    .on('error', function (error) {
      console.error('' + error);
      this.emit('end');
    })
    .pipe(rename(function(path){
      console.log(path.basename);
      path.basename += ".min";
      path.extname = ".js"
    }))
    .pipe(gulp.dest(source['assets']+'/js'));
});
gulp.task('js-watch', ['minify'], browserSync.reload);

// Merge all the libraries into one because...
// "There can only be one." - Highlander
gulp.task('plugins', function() {
  return gulp.src([
    'bower_components/parsleyjs/dist/parsley.js'
  ])
    .pipe(concat('plugins.js'))
    .pipe(gulp.dest(source['assets']+'/js'));
});

// Custom Modernizr bulid out so that we don't end up with a bloated file
gulp.task('modernizr', function() {
  gulp.src(source['assets']+'/js/*.js')
    .pipe(modernizr({
      tests: [
        'csstransforms',
        'touchevents'
      ],
      options: [
        "setClasses",
        "addTest",
        "html5printshiv",
        "testProp",
        "fnBind"
      ]
    }))
    .pipe(gulp.dest(source['assets']+"/js/lib"))
});

// Default task to start local server
gulp.task('default', ['serve']);
