<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Plans / memberships and payment methods have been removed from this application.
 * The Stripe and Paypal payment-gateway add-ons (and their per-company activations)
 * are no longer needed, so this migration cleans them out of the database.
 */
return new class extends Migration
{
    public function up(): void
    {
        $gateways = ['Stripe', 'Paypal', 'PayPal'];

        if (Schema::hasTable('user_active_modules')) {
            DB::table('user_active_modules')->whereIn('module', $gateways)->delete();
        }

        if (Schema::hasTable('add_ons')) {
            DB::table('add_ons')->whereIn('module', $gateways)->delete();
        }
    }

    public function down(): void
    {
        // Payment gateways were intentionally removed; nothing to restore.
    }
};
