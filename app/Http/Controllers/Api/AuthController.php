<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
        'remember' => 'boolean'
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    // Update remember status in database
    $user->remember = $request->remember;
    $user->save();

    // Create token with longer expiration if remember me is checked
    $tokenExpiration = $request->remember ? 43200 : 1440; // 30 days : 1 day
    $token = $user->createToken('admin-token', ['admin'], now()->addMinutes($tokenExpiration))->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'remember' => $user->remember
        ]
    ]);
}

public function forgotPassword(Request $request)
{
    $request->validate([
        'email' => 'required|email|exists:users,email'
    ]);

    $status = Password::sendResetLink(
        $request->only('email')
    );

    if ($status === Password::RESET_LINK_SENT) {
        return response()->json(['message' => 'Password reset link sent']);
    }

    return response()->json(['message' => 'Unable to send reset link'], 400);
}

public function resetPassword(Request $request)
{
    $request->validate([
        'token' => 'required',
        'email' => 'required|email',
        'password' => 'required|confirmed|min:8'
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($user, $password) {
            $user->password = Hash::make($password);
            $user->save();
        }
    );

    if ($status === Password::PASSWORD_RESET) {
        return response()->json(['message' => 'Password reset successfully']);
    }

    return response()->json(['message' => 'Invalid reset token'], 400);
}

    public function logout(Request $request)
{
    try {
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            'message' => 'Logged out successfully'
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Logout failed'
        ], 500);
    }
}


    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
