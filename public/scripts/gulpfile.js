var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var rename = require("gulp-rename");
var autoprefixer = require('gulp-autoprefixer');
var browserify = require('gulp-browserify');
var livereload = require('gulp-livereload');

// Constants
var STYLE_FOLDER = '../statics/styles/';
var JS_BOOTSTRAP = './src/bootstrap.js';
var DEBUG = true;

gulp.task('sass', function () {
    gulp.src(STYLE_FOLDER + 'scss/*.scss')
        .pipe(
            sass({outputStyle : 'compressed'}
        ).on('error', function(err) {
            console.log(err);
        }))
        .pipe(autoprefixer('last 10 version'))
        .pipe(gulp.dest( STYLE_FOLDER ));
});

gulp.task('browserify', function() {
   var stream = gulp.src('./src/bootstrap.js')
        .pipe(browserify({
            debug : DEBUG
        }).on('error', function( err ) {
            console.log(err);
        }))
        .pipe( gulpif( !DEBUG, uglify()) )
        .pipe( rename("game.js") )
        .pipe( gulp.dest('./build/') );
    return stream;
});

gulp.task('watchCSS', function () {
    var watcher = gulp.watch('../statics/styles/scss/modules/*.scss', ['sass']);
});

gulp.task('watchJS', function () {
    gulp.watch([ './src/*.js' ], [ 'browserify']);
    //gulp.watch([ './tests/**/**.js' ], [ 'browserifyTests' ]);
});


gulp.task('beforeBuild', function () {
    DEBUG = false;
});



gulp.task('dev',['watchCSS', 'watchJS' ]);
gulp.task('build', ['beforeBuild', 'sass', 'browserify']);
