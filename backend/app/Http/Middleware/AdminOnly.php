<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = strtoupper((string) $request->user()?->role);

        if ($role !== 'ADMIN') {
            abort(403, 'Administrator access is required.');
        }

        return $next($request);
    }
}