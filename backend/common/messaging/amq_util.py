import uuid

import pika

from ..backend_config import BackendConfig


machine_id = hex(uuid.getnode())[2:]


def amq_connect_blocking(config: BackendConfig):
    conn_params = pika.ConnectionParameters(
        host=config.MESSAGING_HOST,
        port=config.MESSAGING_PORT,
        credentials=pika.PlainCredentials(config.MESSAGING_USERNAME, config.MESSAGING_PASSWORD),
        connection_attempts=2, retry_delay=12    # cause Rabbit is slow to start (docker-compose), seriously 12s
    )
    return pika.BlockingConnection(conn_params)
