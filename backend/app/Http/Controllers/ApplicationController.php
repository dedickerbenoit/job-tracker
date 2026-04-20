<?php

namespace App\Http\Controllers;

use App\Enums\ApplicationStatus;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Http\Requests\UpdateApplicationStatusRequest;
use App\Http\Resources\ApplicationEventResource;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ApplicationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Application::class);

        $dateRules = [
            'from_date' => ['nullable', 'date', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date', 'date_format:Y-m-d'],
        ];
        if ($request->filled('from_date')) {
            $dateRules['to_date'][] = 'after_or_equal:from_date';
        }
        $request->validate($dateRules);

        $query = $request->user()->applications();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('source')) {
            $query->where('source', $request->input('source'));
        }

        if ($request->filled('search')) {
            $search = str_replace(['%', '_'], ['\\%', '\\_'], strtolower($request->input('search')));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(company) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(location) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($request->filled('from_date')) {
            $query->where('created_at', '>=', $request->input('from_date'));
        }

        if ($request->filled('to_date')) {
            $query->where('created_at', '<=', $request->input('to_date'));
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $allowedSorts = ['created_at', 'updated_at', 'company', 'status', 'title'];

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min((int) $request->input('per_page', 50), 100);

        return ApplicationResource::collection($query->paginate($perPage));
    }

    public function store(StoreApplicationRequest $request): JsonResponse
    {
        $this->authorize('create', Application::class);

        $validated = $request->validated();

        $application = new Application;
        $application->user_id = $request->user()->id;
        $application->title = $validated['title'];
        $application->company = $validated['company'];
        $application->location = $validated['location'];
        $application->url = $validated['url'];
        $application->description = $validated['description'] ?? null;
        $application->source = $validated['source'];
        $application->status = $validated['status'] ?? 'to_apply';
        $application->notes = $validated['notes'] ?? null;
        $application->applied_at = $validated['applied_at'] ?? null;

        if ($application->status === ApplicationStatus::Applied && $application->applied_at === null) {
            $application->applied_at = now();
        }

        $application->save();

        $response = ['data' => new ApplicationResource($application)];

        $duplicates = $request->user()->applications()
            ->where('id', '!=', $application->id)
            ->where('url', $validated['url'])
            ->get();

        if ($duplicates->isNotEmpty()) {
            $response['warning'] = [
                'type' => 'duplicate_url',
                'message' => 'Cette URL existe deja dans vos candidatures',
                'duplicates' => ApplicationResource::collection($duplicates),
            ];
        }

        return response()->json($response, 201);
    }

    public function show(Application $application): ApplicationResource
    {
        $this->authorize('view', $application);

        return new ApplicationResource($application);
    }

    public function update(UpdateApplicationRequest $request, Application $application): ApplicationResource
    {
        $this->authorize('update', $application);

        $validated = $request->validated();

        if (isset($validated['title'])) {
            $application->title = $validated['title'];
        }
        if (isset($validated['company'])) {
            $application->company = $validated['company'];
        }
        if (isset($validated['location'])) {
            $application->location = $validated['location'];
        }
        if (isset($validated['url'])) {
            $application->url = $validated['url'];
        }
        if (array_key_exists('description', $validated)) {
            $application->description = $validated['description'];
        }
        if (isset($validated['source'])) {
            $application->source = $validated['source'];
        }
        if (isset($validated['status'])) {
            $application->status = $validated['status'];
        }
        if (array_key_exists('notes', $validated)) {
            $application->notes = $validated['notes'];
        }
        if (array_key_exists('applied_at', $validated)) {
            $application->applied_at = $validated['applied_at'];
        }

        if ($application->status === ApplicationStatus::Applied && $application->applied_at === null) {
            $application->applied_at = now();
        }

        $application->save();

        return new ApplicationResource($application);
    }

    public function destroy(Application $application): JsonResponse
    {
        $this->authorize('delete', $application);

        $application->delete();

        return response()->json(null, 204);
    }

    public function updateStatus(UpdateApplicationStatusRequest $request, Application $application): ApplicationResource
    {
        $this->authorize('update', $application);

        $newStatus = $request->validated()['status'];

        if ($newStatus === ApplicationStatus::Applied->value && $application->applied_at === null) {
            $application->applied_at = now();
        }

        $application->status = $newStatus;
        $application->save();

        return new ApplicationResource($application);
    }

    public function timeline(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Application::class);

        $dateRules = [
            'from_date' => ['nullable', 'date', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date', 'date_format:Y-m-d'],
        ];
        if ($request->filled('from_date')) {
            $dateRules['to_date'][] = 'after_or_equal:from_date';
        }
        $request->validate($dateRules);

        $query = $request->user()->applicationEvents();

        if ($request->filled('application_id')) {
            $query->where('application_id', $request->input('application_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('from_date')) {
            $query->where('created_at', '>=', $request->input('from_date'));
        }

        if ($request->filled('to_date')) {
            $query->where('created_at', '<=', $request->input('to_date'));
        }

        $query->orderByDesc('created_at');
        $perPage = min((int) $request->input('per_page', 50), 100);

        return ApplicationEventResource::collection($query->paginate($perPage));
    }

    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Application::class);

        $user = $request->user();

        $statusCounts = $user->applications()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $sourceCounts = $user->applications()
            ->selectRaw('source, count(*) as count')
            ->groupBy('source')
            ->pluck('count', 'source');

        $total = $user->applications()->count();

        return response()->json([
            'data' => [
                'total' => $total,
                'by_status' => $statusCounts,
                'by_source' => $sourceCounts,
            ],
        ]);
    }
}
