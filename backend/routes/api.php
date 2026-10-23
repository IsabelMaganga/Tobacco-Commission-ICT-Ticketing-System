<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\TicketCommentController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',      [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::apiResource('tickets', TicketController::class);
    Route::patch('tickets/{ticket}/assign',  [TicketController::class, 'assign']);
    Route::patch('tickets/{ticket}/resolve', [TicketController::class, 'resolve']);

    Route::post('tickets/{ticket}/comments',             [TicketCommentController::class, 'store']);
    Route::delete('tickets/{ticket}/comments/{comment}', [TicketCommentController::class, 'destroy']);
});