"use strict";

var less = require('gulp-less');
var gulp = require('gulp');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var server = require("browser-sync").create();
var reload = server.reload;

/* Минификация HTML */
var htmlmin = require("gulp-htmlmin");

/* Минификация CSS */
var minify = require("gulp-csso");

/* Минификация JS*/
var uglify = require("gulp-uglify");

/* Отдельный плагин для переименования файла */
var rename = require("gulp-rename");

/* Оптимизация изображений */
var imagemin = require("gulp-imagemin");

/* Конвертация изображений в Webp для blink браузеров */
var webp = require("gulp-webp");

/* Сборка SVG-спрайтов */
var svgstore = require("gulp-svgstore");

/* Специальный плагин для последовательного запуска задач друг за другом.
Позволяет дождаться результата одного таска, затем запускает следующий */
var run = require("run-sequence");

/* Модуль для удаления файлов */
var del = require("del");

/* POSTHTML для минификации HTML с плагином для вставки
других файлов в HTML файл с помощью <include src=""></include> */
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");


gulp.task("html", function() {       /* название таска*/
  return gulp.src("./html/*.html") /* откуда берет файлы */
    .pipe(posthtml([
      include()                      /* конвертирует все <include></include> */
    ]))
    .pipe(htmlmin({                  /* Минификация HTML*/
      collapseWhitespace: true,
      ignoreCustomFragments: [ /<br>\s/gi ]  /*Не убираем пробел после <br> */
    }))
    .pipe(gulp.dest("./build"))      /* куда кидает файлы */
    .pipe(server.stream());          /* команда перезагрузки сервера в браузере */
});

gulp.task("style", function() {
  gulp.src("./less/*.less")
    .pipe(plumber())
    .pipe(less())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(minify({
      restructure: false          /*Отключаем смешивание общих стилей, чтобы не страдать*/
    }))
    .pipe(gulp.dest("./build/css"))
    .pipe(server.stream());
});

gulp.task("scripts", function () {
  return gulp.src("./script/*.js")
    .pipe(plumber())
    .pipe(uglify())
    .pipe(rename({suffix: ".min"}))
    .pipe(gulp.dest("build/js"))
    .pipe(server.stream());
});

gulp.task("images", function() {
  return gulp.src("./img/*.{png,jpg,svg}")
    .pipe(imagemin([    /* imagemin сам по себе содержит в себе множество плагинов (работа с png,svg,jpg и тд) */
      imagemin.optipng({optimizationLevel: 3}),  /* 1 - максимальное сжатие, 3 - безопасное сжатие, 10 - без сжатия */
      imagemin.jpegtran({progressive: true}),    /* прогрессивная загрузка jpg (изображение постепенно прорисовывается при загрузке) */
      imagemin.svgo()   /*Минификация svg от лишних тегов*/
      ]))
    .pipe(gulp.dest("./build/img"));
});

gulp.task("clean-images", function() {
  return del("./build/img/**/*.{png,jpg,svg,webp}");
});

gulp.task("images-watch", function() {
  run(
    "clean-images",
    "images",
    "html"      /* Это чтобы перезагрузить страничку*/
    );
});

gulp.task("build", function(done) {
  run(
    "style",
    "scripts",
    "images",
    "html",
    done  /* Самым последним вызовом функции run должна быть функция, которая была передана как аргумент */
  );
});

gulp.task('serve', function() {
  server.init({
    server: "./build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch('less/**/*.less', ["style"]);
  gulp.watch('html/*.html').on('change', server.reload);
  gulp.watch("script/*.js", ["scripts"]);
  gulp.watch("img/*.{png,jpg,svg,webp}", ["images-watch"]);
});
