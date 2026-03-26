import io
from uuid import uuid4

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def _get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=f"{'https' if settings.MINIO_USE_SSL else 'http'}://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=BotoConfig(signature_version="s3v4"),
        region_name="us-east-1",
    )


def ensure_bucket() -> None:
    client = _get_s3_client()
    try:
        client.head_bucket(Bucket=settings.MINIO_BUCKET)
    except ClientError:
        client.create_bucket(Bucket=settings.MINIO_BUCKET)
        logger.info("bucket_created", bucket=settings.MINIO_BUCKET)


def upload_file(data: bytes, filename: str, content_type: str = "application/octet-stream") -> str:
    client = _get_s3_client()
    key = f"{uuid4().hex[:8]}/{filename}"
    client.upload_fileobj(
        Fileobj=io.BytesIO(data),
        Bucket=settings.MINIO_BUCKET,
        Key=key,
        ExtraArgs={"ContentType": content_type},
    )
    return f"{settings.MINIO_PUBLIC_URL}/{settings.MINIO_BUCKET}/{key}"


def download_file(key: str) -> bytes:
    client = _get_s3_client()
    buf = io.BytesIO()
    client.download_fileobj(settings.MINIO_BUCKET, key, buf)
    buf.seek(0)
    return buf.read()


def delete_file(key: str) -> None:
    client = _get_s3_client()
    client.delete_object(Bucket=settings.MINIO_BUCKET, Key=key)


def check_storage() -> bool:
    try:
        client = _get_s3_client()
        client.head_bucket(Bucket=settings.MINIO_BUCKET)
        return True
    except Exception:
        return False
