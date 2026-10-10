<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DocentesController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Panel/Docentes');
    }
}
