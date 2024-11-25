<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        // Explicitly check for admin guard
        if (!$request->user('admin') || !in_array($request->user('admin')->role, $roles)) {
            return response()->json([
                'message' => 'Unauthorized access'
            ], 403);
        }

        return $next($request);
    }
}