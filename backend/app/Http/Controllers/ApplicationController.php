<?php

namespace App\Http\Controllers;

use App\DTOs\Application\ApplicationFilterData;
use App\DTOs\Application\StoreApplicationData;
use App\DTOs\Application\UpdateApplicationData;
use App\DTOs\Timeline\TimelineFilterData;
use App\Http\Requests\Application\IndexApplicationRequest;
use App\Http\Requests\Application\TimelineRequest;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Http\Requests\UpdateApplicationStatusRequest;
use App\Http\Resources\ApplicationEventResource;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use App\Services\Application\ApplicationService;
use App\Services\Application\TimelineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ApplicationController extends Controller
{
    public function __construct(
        private readonly ApplicationService $applicationService,
        private readonly TimelineService $timelineService,
    ) {}

    public function index(IndexApplicationRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Application::class);

        $filters = ApplicationFilterData::fromRequest($request);

        return ApplicationResource::collection($this->applicationService->list($request->user(), $filters));
    }

    public function store(StoreApplicationRequest $request): JsonResponse
    {
        $this->authorize('create', Application::class);

        $result = $this->applicationService->create($request->user(), StoreApplicationData::fromRequest($request));

        $response = ['data' => new ApplicationResource($result['application'])];

        if ($result['duplicates']->isNotEmpty()) {
            $response['warning'] = [
                'type' => 'duplicate_url',
                'message' => 'Cette URL existe deja dans vos candidatures',
                'duplicates' => ApplicationResource::collection($result['duplicates']),
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

        $application = $this->applicationService->update($application, UpdateApplicationData::fromRequest($request));

        return new ApplicationResource($application);
    }

    public function destroy(Application $application): JsonResponse
    {
        $this->authorize('delete', $application);

        $this->applicationService->delete($application);

        return response()->json(null, 204);
    }

    public function updateStatus(UpdateApplicationStatusRequest $request, Application $application): ApplicationResource
    {
        $this->authorize('update', $application);

        $application = $this->applicationService->updateStatus($application, $request->validated('status'));

        return new ApplicationResource($application);
    }

    public function timeline(TimelineRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Application::class);

        $filters = TimelineFilterData::fromRequest($request);

        return ApplicationEventResource::collection($this->timelineService->list($request->user(), $filters));
    }

    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Application::class);

        return response()->json(['data' => $this->applicationService->getStats($request->user())]);
    }
}
