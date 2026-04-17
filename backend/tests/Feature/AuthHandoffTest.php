<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthHandoffTest extends TestCase
{
    use RefreshDatabase;

    // ── create-handoff-token ──

    public function test_create_handoff_token_requires_authentication(): void
    {
        $response = $this->postJson('/api/auth/create-handoff-token');

        $response->assertStatus(401);
    }

    public function test_create_handoff_token_returns_short_lived_token_with_handoff_ability(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);

        $response = $this->postJson('/api/auth/create-handoff-token');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['token']]);

        $plainToken = $response->json('data.token');
        $this->assertNotEmpty($plainToken);

        // Find the created token in DB
        $tokenId = (int) explode('|', $plainToken)[0];
        $token = PersonalAccessToken::find($tokenId);

        $this->assertNotNull($token);
        $this->assertSame('handoff', $token->name);
        $this->assertSame(['handoff'], $token->abilities);
        $this->assertNotNull($token->expires_at);
        // Expires within the next ~2 minutes
        $this->assertTrue($token->expires_at->lessThanOrEqualTo(now()->addMinutes(2)));
    }

    // ── token-login ──

    public function test_token_login_exchanges_handoff_token_for_session(): void
    {
        $user = User::factory()->create();

        // Create a handoff token
        $plainToken = $user->createToken('handoff', ['handoff'], now()->addMinute())->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $plainToken,
        ])->postJson('/api/auth/token-login');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['user' => ['id', 'first_name', 'last_name', 'email']],
            ])
            ->assertJsonPath('data.user.id', $user->id);

        // Session should now be authenticated
        $this->assertAuthenticatedAs($user);
    }

    public function test_token_login_deletes_token_after_use_one_shot(): void
    {
        $user = User::factory()->create();
        $plainToken = $user->createToken('handoff', ['handoff'], now()->addMinute())->plainTextToken;
        $tokenId = (int) explode('|', $plainToken)[0];

        $this->withHeaders([
            'Authorization' => 'Bearer ' . $plainToken,
        ])->postJson('/api/auth/token-login')->assertStatus(200);

        // Token should be deleted
        $this->assertNull(PersonalAccessToken::find($tokenId));
    }

    public function test_token_login_rejects_invalid_or_deleted_token(): void
    {
        // A bearer token whose underlying PersonalAccessToken does not exist
        // must be rejected by auth:sanctum (401). This is the guarantee that
        // consumed handoff tokens (deleted one-shot) cannot be reused.
        $response = $this->withHeaders([
            'Authorization' => 'Bearer 9999|nonexistent-token-value',
        ])->postJson('/api/auth/token-login');

        $response->assertStatus(401);
    }

    public function test_token_login_rejects_token_without_handoff_ability(): void
    {
        $user = User::factory()->create();
        // Regular access token (no 'handoff' ability)
        $plainToken = $user->createToken('auth')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $plainToken,
        ])->postJson('/api/auth/token-login');

        $response->assertStatus(403);
    }

    public function test_token_login_requires_authentication(): void
    {
        $response = $this->postJson('/api/auth/token-login');

        $response->assertStatus(401);
    }

    public function test_token_login_rejects_expired_handoff_token(): void
    {
        $user = User::factory()->create();
        // Create a token that expired 1 minute ago
        $plainToken = $user->createToken('handoff', ['handoff'], now()->subMinute())->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $plainToken,
        ])->postJson('/api/auth/token-login');

        $response->assertStatus(401);
    }

    public function test_token_login_rejects_wildcard_ability_token(): void
    {
        $user = User::factory()->create();
        // Wildcard ability token must not be accepted as a handoff token
        $plainToken = $user->createToken('auth', ['*'])->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $plainToken,
        ])->postJson('/api/auth/token-login');

        $response->assertStatus(403);
    }

    public function test_token_login_rejects_token_with_extra_abilities(): void
    {
        $user = User::factory()->create();
        // A token that *contains* 'handoff' but also other abilities must be rejected
        $plainToken = $user->createToken('mixed', ['handoff', 'read'], now()->addMinute())->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $plainToken,
        ])->postJson('/api/auth/token-login');

        $response->assertStatus(403);
    }

    public function test_token_login_expels_stale_session_cookie(): void
    {
        // A different user is logged in via session, then another user's handoff
        // token is presented. The stale session must be discarded and the new user
        // authenticated instead.
        $stale = User::factory()->create();
        $this->actingAs($stale);

        $target = User::factory()->create();
        $plainToken = $target->createToken('handoff', ['handoff'], now()->addMinute())->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $plainToken,
        ])->postJson('/api/auth/token-login');

        $response->assertStatus(200)
            ->assertJsonPath('data.user.id', $target->id);

        $this->assertAuthenticatedAs($target);
    }

    // ── login session/token mode cookie semantics ──

    public function test_login_in_token_mode_does_not_persist_auth_to_session(): void
    {
        // Token mode uses Auth::once() which does NOT persist authentication
        // into the session. A subsequent request sharing the same session
        // (cookies propagate in Laravel tests) must therefore be unauthenticated
        // when the Bearer token is not provided.
        $user = User::factory()->create([
            'email' => 'token-mode@test.local',
            'password' => bcrypt('secret-password'),
        ]);

        $response = $this->withHeaders([
            'X-Request-Token' => 'true',
            'Origin' => 'http://localhost',
        ])->postJson('/api/auth/login', [
            'email' => 'token-mode@test.local',
            'password' => 'secret-password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['user', 'token']]);

        // Flush all in-memory auth guard state — otherwise Laravel's testing
        // harness carries Auth::once()'s setUser() across requests in-memory
        // and makes the follow-up appear authenticated even though nothing
        // was written to the session. We only care about persisted auth.
        $this->app['auth']->forgetGuards();

        // Follow-up request WITHOUT Bearer token must be rejected: proves that
        // token-mode login did not leak auth into the shared session store.
        $followup = $this->withHeaders([
            'Origin' => 'http://localhost',
        ])->getJson('/api/auth/me');

        $followup->assertStatus(401);
    }

    public function test_login_in_session_mode_persists_auth_to_session(): void
    {
        // Session mode uses Auth::attempt() which persists authentication into
        // the session. A subsequent request sharing the same session must see
        // the user as authenticated, even without a Bearer token.
        $user = User::factory()->create([
            'email' => 'session-mode@test.local',
            'password' => bcrypt('secret-password'),
        ]);

        $response = $this->withHeaders([
            'Origin' => 'http://localhost',
        ])->postJson('/api/auth/login', [
            'email' => 'session-mode@test.local',
            'password' => 'secret-password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['user']])
            ->assertJsonMissingPath('data.token');

        // Clear in-memory guard state so the follow-up resolves auth strictly
        // from the persisted session store, not from a lingering setUser() call.
        $this->app['auth']->forgetGuards();

        // Follow-up request without any Bearer token sees the persisted session.
        $followup = $this->withHeaders([
            'Origin' => 'http://localhost',
        ])->getJson('/api/auth/me');

        $followup->assertStatus(200)
            ->assertJsonPath('data.email', 'session-mode@test.local');
    }
}
