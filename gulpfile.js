var gulp = require('gulp');
// shell commands
var shell = require('gulp-shell');
// server
var browserSync = require('browser-sync').create();
// css
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
// js
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
// misc
var clean = require('gulp-clean');
var runSequence = require('run-sequence');
var gulpIf = require('gulp-if');
var argv = require('yargs').argv;


// envoirement variable '--dev' -> development true or false
if (argv.dev) {
  var dev = true;
}

/* INDIVIDUAL TASKS
*/

gulp.task('clean', function () {
	return gulp.src('public', {read: false})
		.pipe(clean());
});

// build jekyll dev
gulp.task('jekyll-dev', shell.task(
  ['jekyll build --config _config.yml,_config_dev.yml -q']
));

// build jekyll dev
gulp.task('jekyll-prod', shell.task(
  ['jekyll build -q']
));
 
// css
gulp.task('css', function () {
  gulp.src('dev/_assets/scss/style.scss')
  	.pipe(gulpIf( dev, sourcemaps.init() ))
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulpIf( dev, sass({outputStyle: 'expanded'}), sass({outputStyle: 'compressed'}) ))
    .pipe(gulpIf( dev, sourcemaps.write() ))
	  .pipe(autoprefixer({ browsers: ['last 2 versions'], cascade: false }))
  	.pipe(gulp.dest('./public/assets/css'))
  	.pipe(gulpIf( dev, browserSync.reload({stream:true}) ))
});

// js
gulp.task('js', function() {
  return gulp.src('dev/_assets/js/global.js')
    .pipe(jshint())
	  .pipe(jshint.reporter('default'))
    .pipe(concat('global.js'))
    .pipe(gulpIf( !dev,  uglify() ))
    .pipe(gulp.dest('./public/assets/js'))
    .pipe(gulpIf( dev, browserSync.reload({stream:true}) ))
});

// browser-sync
gulp.task('server', function() {
  browserSync.init({
      server: "./public",
      online: true
  });
  
  // watch files
  gulp.watch('dev/_assets/scss/*.scss', ['css']);
  gulp.watch('dev/_assets/js/*.js', ['js']);
  gulp.watch([
  	'dev/*.html', 
  	'dev/_layouts/*.html', 
  	'dev/_posts/*.md', 
  	'dev/_includes/*.html', 
  	'dev/_drafts/*'
  ], ['build-dev']).on('change', browserSync.reload);
});

/* MAIN TASKS

gulp -dev -> for development. Builds and starts server.
gulp deploy -> for deploying. Deploys the site to your source

*/

gulp.task('default', function(callback) {
  runSequence(
    'jekyll-dev',
    'css',
    'js',
    'server',
    callback);
});

gulp.task('build-dev', function(callback) {
  runSequence(
    'jekyll-dev',
    'css',
    'js',
    callback);
});

gulp.task('build-prod', function(callback) {
  runSequence(
    'jekyll-prod',
    'css',
    'js',
    callback);
});

gulp.task('deploy', ['build-prod'], shell.task([
  'cd public/ && git add --all && git commit -m "auto update" && git push origin gh-pages'
]));