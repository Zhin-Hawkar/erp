<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class PlanModuleCheck
{
    /**
     * Handle an incoming request.
     *
     * Plans / memberships have been removed from this application. This middleware
     * no longer performs any subscription, trial or plan-expiry checks. It only
     * retains the optional add-on/module availability check so that routes guarded
     * by a specific module (e.g. PlanModuleCheck:ModuleName) keep working.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, $moduleName = null): Response
    {
        $user = Auth::user();
        if (!$user) {
            return $next($request);
        }

        // Optional per-route add-on/module availability check (unrelated to plans).
        if ($moduleName != null) {
            $moduleName = explode('-', $moduleName);
            foreach ($moduleName as $m) {
                if (module_is_active($m) == true) {
                    return $next($request);
                }
            }
            return redirect()->route('dashboard')->with('error', __('Permission denied '));
        }

        return $next($request);
    }
}
