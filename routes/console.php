<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('noticias:purgar-papelera')->dailyAt('03:00');
Schedule::command('docentes:purgar-papelera')->dailyAt('03:15');
Schedule::command('documentos:purgar-papelera')->dailyAt('03:30');
