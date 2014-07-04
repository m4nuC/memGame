<?php
Route::get('/', function()
{
    $baseURL = URL::to('/');
    return View::make('main')->with(['baseURL'=>$baseURL]);
});

Route::resource('/scores', "ScoresController");
