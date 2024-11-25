<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\CustomerUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Notifications\ResetCustomerNotification;
use Illuminate\Support\Facades\DB; 

class LoginCustomerController extends Controller
{
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
                'device_name' => 'nullable|string'
            ]);

            $customer = CustomerUser::where('email', $request->email)->first();

            if (!$customer || !Hash::check($request->password, $customer->password)) {
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }

            if ($customer->status === 'suspended') {
                return new PostResource(false, 'Account is suspended. Please verify your email first.', null);
            }

            if ($customer->status === 'inactive') {
                return new PostResource(false, 'Account is inactive. Please contact support.', null);
            }

            // Update last login timestamp
            $customer->updateLastLogin();

            // Generate token with device name
             $token = $customer->createToken($request->device_name ?? 'Unknown Device', ['customer'])->plainTextToken;

            return new PostResource(true, 'Login successful', [
                'user' => $customer,
                'token' => $token
            ]);

        } catch (\Exception $e) {
            return new PostResource(false, $e->getMessage(), null);
        }
    }

    public function logout(Request $request)
    {
        try {
            // Delete all tokens instead of just current token for complete logout
            $request->user()->tokens()->delete();
            
            return new PostResource(true, 'Successfully logged out', null);
        } catch (\Exception $e) {
            return new PostResource(false, $e->getMessage(), null);
        }
    }

    public function forgotPassword(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email|exists:customer_users,email'
            ]);

            $token = Str::random(64);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $request->email],
                [
                    'token' => Hash::make($token),
                    'created_at' => now()
                ]
            );

            // Send password reset email with token
            // You'll need to create this notification
            $customer = CustomerUser::where('email', $request->email)->first();
            $customer->notify(new ResetCustomerNotification($token));

            return new PostResource(true, 'Password reset link sent to your email', null);

        } catch (\Exception $e) {
            return new PostResource(false, $e->getMessage(), null);
        }
    }

    public function resetPassword(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email|exists:customer_users,email',
                'token' => 'required|string',
                'password' => 'required|string|min:8|confirmed'
            ]);

            $resetRecord = DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->first();

            if (!$resetRecord || !Hash::check($request->token, $resetRecord->token)) {
                return new PostResource(false, 'Invalid reset token', null);
            }

            if (now()->diffInHours($resetRecord->created_at) > 24) {
                return new PostResource(false, 'Reset token has expired', null);
            }

            $customer = CustomerUser::where('email', $request->email)->first();
            $customer->update([
                'password' => Hash::make($request->password)
            ]);

            // Delete the reset token
            DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->delete();

            return new PostResource(true, 'Password has been reset successfully', null);

        } catch (\Exception $e) {
            return new PostResource(false, $e->getMessage(), null);
        }
    }

    public function me(Request $request)
    {
        try {
            $customer = $request->user();
            return new PostResource(true, 'User profile retrieved successfully', $customer);
        } catch (\Exception $e) {
            return new PostResource(false, $e->getMessage(), null);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $request->validate([
                'username' => 'sometimes|string|unique:customer_users,username,' . $request->user()->id,
            ]);

            $customer = $request->user();

            if ($request->has('username')) {
                $customer->username = $request->username;
            }

            $customer->save();

            return new PostResource(true, 'Profile updated successfully', $customer);

        } catch (\Exception $e) {
            return new PostResource(false, $e->getMessage(), null);
        }
    }
    
    public function changePassword(Request $request)
{
    try {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $customer = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $customer->password)) {
            return new PostResource(false, 'Current password is incorrect', null);
        }

        // Update password
        $customer->update([
            'password' => Hash::make($request->new_password)
        ]);

        // Optional: Revoke all tokens to force re-login
        // $customer->tokens()->delete();

        return new PostResource(true, 'Password has been changed successfully', null);

    } catch (\Exception $e) {
        return new PostResource(false, $e->getMessage(), null);
    }
}
}
