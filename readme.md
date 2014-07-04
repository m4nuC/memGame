## COLOR MEMORY

Live Demo [here](http://stage.nota.io/)

### Installation

- Clone this repositary
- Install [Composer](https://getcomposer.org/doc/00-intro.md)
- In the terminal, go to the root of the project. (If you didn't change the repo name it should be called accedoMemGame)
- Run `sudo composer install` (This should take about 10 minutes)
- Run `sudo chmod -R 777 app/storage`.
- Open `app/config/database.php` and at `line 57` change database credentials according to your local configuration.
- From the terminal run: "php artisan migrate".
- From the terminal run: "php artisan serve".
- Open a browser and go to [http://localhost:8000/](http://localhost:8000/) to play.

### Development
- `cd` into `public/scripts` and run `gulp dev` to get in watch mode and auto compilte (CSS and JS)
- `cd` into `public/scripts` and run `gulp build` to create a minified build files

## Requirements

- PHP 5.4+
- MYSQL
- NodeJS (For development). Note: All node modules are included in the repo for easier deployments


