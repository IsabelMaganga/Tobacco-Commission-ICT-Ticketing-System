<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\TicketCommentController;
use App\Http\Controllers\Api\UserController;
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
    Route::prefix('v1/admin')->middleware('admin')->group(function () {
        Route::get('slas', [AdminController::class, 'indexSlas']);
        Route::post('slas', [AdminController::class, 'storeSla']);
        Route::get('business-hours', [AdminController::class, 'indexBusinessHours']);
        Route::post('business-hours', [AdminController::class, 'storeBusinessHour']);
        Route::get('holidays', [AdminController::class, 'indexHolidays']);
        Route::post('holidays', [AdminController::class, 'storeHoliday']);
        Route::get('routing-rules', [AdminController::class, 'indexRoutingRules']);
        Route::post('routing-rules', [AdminController::class, 'storeRoutingRule']);
        Route::get('groups', [AdminController::class, 'indexGroups']);
        Route::post('groups', [AdminController::class, 'storeGroup']);
        Route::get('workload', [AdminController::class, 'workload']);
        Route::post('users', [AdminController::class, 'onboardUser']);
        Route::patch('users/{user}/role', [AdminController::class, 'assignRole']);
        Route::patch('users/{user}/availability', [AdminController::class, 'updateAvailability']);
        Route::delete('tickets/{ticket}', [AdminController::class, 'destroyTicket']);
        Route::patch('tickets/{ticket}', [AdminController::class, 'interveneTicket']);
        Route::patch('tickets/{ticket}/sla', [AdminController::class, 'pauseSla']);
        Route::patch('tickets/{ticket}/redact', [AdminController::class, 'redactTicket']);
        Route::get('audit-logs', [AdminController::class, 'auditLogs']);
        Route::get('analytics', [AdminController::class, 'analytics']);
    });

    Route::middleware('role:admin,manager')->group(function () {
        Route::get('users', [UserController::class, 'index']);
        Route::patch('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);
    });

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::apiResource('tickets', TicketController::class)->except(['create', 'edit']);
    Route::patch('tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
    Route::post('tickets/{ticket}/interactions', [TicketController::class, 'storeInteraction']);
    Route::middleware('role:admin,manager,ict_officer,tier_1,tier_2_3')->group(function () {
        Route::patch('tickets/{ticket}/assign', [TicketController::class, 'assign']);
        Route::patch('tickets/{ticket}/sla', [TicketController::class, 'overrideSla']);
    });
    Route::post('tickets/{ticket}/comments',             [TicketCommentController::class, 'store']);
    Route::delete('tickets/{ticket}/comments/{comment}', [TicketCommentController::class, 'destroy']);
});