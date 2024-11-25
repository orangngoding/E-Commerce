<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Http\Resources\PostResource;

class EnsureCustomerIsActive
{
    public function handle(Request $request, Closure $next)
{
    if ($request->user('customer') && $request->user('customer')->status !== 'active') {
        return response()->json(new PostResource(
            false,
            'Your account is not active. Please verify your email or contact support.',
            null
        ), 403);
    }
    return $next($request);
}

}
