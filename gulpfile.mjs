// Gulp File Info:
// npm run dev - для режима dev
// npm run prod - для режима production
// 
// чтобы эти команды работали, нужно предварительно добавить в package.json:
//	"type": "module", (если gulpfile.mjs а не .js)
// "scripts": {
//   "dev": "NODE_ENV=development gulp dev",
//   "build": "NODE_ENV=production gulp build"
// }
//
// dev:
// - быстрая сборка, без оптимизации html и images
// - включен liveserver и watch по обновлению
//
// prod:
// - очищается папка dist перед сборкой
// - оптимизируются html, css и images
// - не запускается сервер и слежка

import gulp from "gulp";
import browserSync from "browser-sync";
import gulpSass from "gulp-sass";
import dartSass from "sass";
import rename from "gulp-rename";
import autoprefixer from "gulp-autoprefixer";
import cleanCSS from "gulp-clean-css";
import imagemin from "gulp-imagemin";
import webp from "gulp-webp";
import htmlmin from "gulp-htmlmin";
import del from "del";
import gulpIf from "gulp-if";
import replace from "gulp-replace";
import { build } from "esbuild";

const sass = gulpSass(dartSass);

// Режим сборки
const isProd = process.env.NODE_ENV === "production";
const isDev = !isProd;
console.log(`Gulp is running in ${isProd ? "PRODUCTION" : "DEVELOPMENT"} mode.`)

// Пути к файлам
const paths = {
	html: {
		src: "src/*.html",
		dist: "dist/"
	},
	styles: {
		src: "src/sass/**/*.+(scss|sass)",
		dist: "dist/css"
	},
	scripts: {
		src: "src/js/**/*.js",
		dist: "dist/js"
	},
	images: {
		src: "src/img/**/*",
		srcWebp: "src/img/**/*.{jpg,jpeg,png}",
		srcOther: "src/img/**/*.{svg,ico,gif}",
		dist: "dist/img"
	},
	fonts: {
		src: "src/fonts/**/*",
		dist: "dist/fonts"
	},
	icons: {
		src: "src/icons/**/*",
		dist: "dist/icons"
	}
};

// Чистка "dist"
export const clean = () => del("dist");

// Задачи связанные с файлами html
export const html = () => gulp.src(paths.html.src) // выбрать все файлы .html в папке paths.html.src
	.pipe(replace(/\.(jpg|jpeg|png)/g, ".webp")) // если режим PRODUCTION, то заменить в файле jpg/jpeg/png на webp
	.pipe(gulpIf(isProd, htmlmin({ collapseWhitespace: true }))) // если режим PRODUCTION, то прогнать через htmlmin убрав пробелы
	.pipe(gulp.dest(paths.html.dist)) // положить готовый файл в paths.html.dist
	.pipe(browserSync.stream());

// Задачи связанные со стилями
export const styles = () => gulp.src(paths.styles.src) // выбрать все файлы в папке paths.styles.src
	.pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError)) // выполнить формат scss/sass -> css сжатый
	.pipe(rename({ prefix: "", suffix: ".min" })) // переименовать файл css сжатый в *.min.css
	.pipe(autoprefixer()) // сделать автопрефиксы
	.pipe(cleanCSS({compatibility: "ie8"})) // почистить код css с совместимостью с ie8
	.pipe(replace(/\.(jpg|jpeg|png)/g, ".webp")) // если режим PRODUCTION, то заменить в файле jpg/jpeg/png на webp
	.pipe(gulp.dest(paths.styles.dist)) // положить готовый файл в папку paths.styles.dist
	.pipe(browserSync.stream());

// Задачи связанные со скриптами
// OLD
// export const scripts = () => gulp.src(paths.scripts.src) // выбрать все файлы .js в папке paths.scripts.src, при этом учесть папки внутри js, если они есть
// 	.pipe(gulp.dest(paths.scripts.dist)) // положить готовый файл в paths.scripts.dist
// 	.pipe(browserSync.stream());
export const scripts = () => {
	return build({
		entryPoints: ['src/js/script.js'], // входной файл
		bundle: true, // объединяет entryPoints и все зависимости (включая модули из node_modules) в один итоговый файл
		minify: isProd, // минифицирует JS, только если режим production (чтобы в dev всё было читаемо)
		sourcemap: isDev, // добавляет sourcemaps (источник кода), только в dev-режиме, чтобы можно было отлаживать в браузере
		outfile: 'dist/js/script.js', // куда сохранить итоговый файл
		target: ['es2015'], // целевой стандарт JS: es2015 = поддержка большинства современных браузеров
		format: 'esm', // формат итогового JS: esm = модульный, поддерживает import/export прямо в браузере (<script type="module">)
		loader: { '.js': 'js' } // явно указываем, как обрабатывать .js файлы
	}).then(() => {
		browserSync.reload();
	});
}

// Задачи связанные с картинками
export const images = () => gulp.src(paths.images.srcOther, { encoding: false }) // выбрать все файлы в папке paths.images.src
	.pipe(gulpIf(isProd, imagemin())) // если режим PRODUCTION, то минимизировать картинки
	.pipe(gulp.dest(paths.images.dist)) // положить готовый файл в paths.images.dist
	.pipe(browserSync.stream());

export const imagesToWebp = () => gulp.src(paths.images.srcWebp, { encoding: false }) // выбрать все файлы в папке paths.images.srcWebp
	.pipe(webp({ quality: 100 })) // конвертировать в webp для оптимизации 
	.pipe(gulp.dest(paths.images.dist)) // положить готовые файлы в paths.images.dist
	.pipe(browserSync.stream());

// Задачи связанные со шрифтами
export const fonts = () => gulp.src(paths.fonts.src, { encoding: false }) // выбрать все файлы в папке paths.fonts.src
	.pipe(gulp.dest(paths.fonts.dist)); // положить готовый файл в paths.fonts.dist

// Задачи связанные с иконками
export const icons = () => gulp.src(paths.icons.src, { encoding: false }) // выбрать все файлы в папке paths.icons.src
	.pipe(gulp.dest(paths.icons.dist)) // положить готовый файл в paths.icons.dist
	.pipe(browserSync.stream());

// Объединение задач fonts, icons, images и images-to-webp в одну для удобства
export const assetsActions = gulp.parallel(fonts, icons, images, imagesToWebp);

// Инициализация LiveServer
export const createServer = () => {
	browserSync.init({
		server: { baseDir: "dist" } // по директории /dist
	});
}

// Задачи связанные с изменениями в файлах
export const watch = () => {
	gulp.watch(paths.html.src, html); // если есть изменения в любом из файлов .html - выполнить задачу html
	gulp.watch(paths.styles.src, styles); // если есть изменения в каком либо из файлов по пути - выполнить задачу styles
	gulp.watch(paths.scripts.src, scripts);
	gulp.watch(paths.images.srcOther, images);
	gulp.watch(paths.images.srcWebp, imagesToWebp);
	gulp.watch(paths.fonts.src, fonts);
	gulp.watch(paths.icons.src, icons);
}

// DEV build
export const dev = gulp.series(
	clean,
	gulp.parallel(html, styles, scripts, assetsActions),
	gulp.parallel(createServer, watch)
);

// PROD build
export const prod = gulp.series(
	clean,
	gulp.parallel(html, styles, scripts, assetsActions)
);

gulp.task("dev", dev);
gulp.task("prod", prod);