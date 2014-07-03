var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserify = require('gulp-browserify');
var livereload = require('gulp-livereload');

var STYLE_FOLDER = '../statics/styles/';

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

gulp.task('watchCSS', function () {
    var watcher = gulp.watch('../statics/styles/scss/modules/*.scss', ['sass']);
});

gulp.task('dev',['watchCSS' ]);

