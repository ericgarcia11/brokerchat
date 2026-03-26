from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "wwp",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_queue="default",
    task_queues={
        "default": {"exchange": "default", "routing_key": "default"},
        "webhooks": {"exchange": "webhooks", "routing_key": "webhooks"},
        "messages": {"exchange": "messages", "routing_key": "messages"},
        "agents": {"exchange": "agents", "routing_key": "agents"},
    },
    task_routes={
        "app.workers.tasks.webhook.*": {"queue": "webhooks"},
        "app.workers.tasks.message.*": {"queue": "messages"},
        "app.workers.tasks.agent.*": {"queue": "agents"},
    },
    beat_schedule={
        "retry-failed-messages": {
            "task": "app.workers.tasks.scheduled.retry_failed_messages",
            "schedule": 300.0,  # 5 min
        },
        "close-idle-chats": {
            "task": "app.workers.tasks.scheduled.close_idle_chats",
            "schedule": 600.0,  # 10 min
        },
        "cleanup-temp-files": {
            "task": "app.workers.tasks.scheduled.cleanup_temp_files",
            "schedule": 3600.0,  # 1 hora
        },
        "reprocess-error-webhooks": {
            "task": "app.workers.tasks.scheduled.reprocess_error_webhooks",
            "schedule": 900.0,  # 15 min
        },
        "sync-connection-status": {
            "task": "app.workers.tasks.scheduled.sync_connection_status",
            "schedule": 1800.0,  # 30 min
        },
        "reschedule-orphaned-cadences": {
            "task": "app.workers.tasks.scheduled.reschedule_orphaned_cadences",
            "schedule": 300.0,  # 5 min — reag. limpa qualquer task perdida do Redis
        },
    },
)

celery_app.autodiscover_tasks([
    "app.workers.tasks",
])
