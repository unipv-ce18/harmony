import uuid

import pika

from ..backend_config import BackendConfig


machine_id = hex(uuid.getnode())[2:]


def amq_connect_blocking(config: BackendConfig, disable_heartbeat=False):
    conn_params = {
        'host': config.MESSAGING_HOST,
        'port': config.MESSAGING_PORT,
        'credentials': pika.PlainCredentials(config.MESSAGING_USERNAME, config.MESSAGING_PASSWORD),
        'connection_attempts': 3, 'retry_delay': 12,    # cause Rabbit is slow to start (docker-compose), seriously 12s
    }
    if disable_heartbeat:
        conn_params['heartbeat'] = 0

    return pika.BlockingConnection(pika.ConnectionParameters(**conn_params))


def amq_notification_declaration(channel, config: BackendConfig):
    channel.exchange_declare(
        exchange=config.MESSAGING_EXCHANGE_NOTIFICATION,
        exchange_type='direct',
        durable=True
    )


def amq_worker_declaration(channel, config: BackendConfig):
    channel.exchange_declare(
        exchange=config.MESSAGING_EXCHANGE_WORKER,
        exchange_type='direct',
        durable=True
    )
    channel.queue_declare(
        queue=config.MESSAGING_QUEUE_WORKER,
        durable=True,
        arguments={'x-message-ttl': 60000}
    )
    channel.queue_bind(
        exchange=config.MESSAGING_EXCHANGE_WORKER,
        queue=config.MESSAGING_QUEUE_WORKER,
        routing_key='id'
    )
    amq_notification_declaration(channel, config)


def amq_producer_declaration(channel, config: BackendConfig):
    queue_name = f'apisvc-{machine_id}'

    channel.exchange_declare(
        exchange=config.MESSAGING_EXCHANGE_JOBS,
        exchange_type='direct',
        durable=True
    )
    channel.queue_declare(
        queue=queue_name,
        arguments={
            'x-expires': 86400000,    # queue expires if not used for 24 hours
            'x-message-ttl': 60000
        }
    )
    amq_notification_declaration(channel, config)

    return queue_name


def amq_orchestrator_declaration(channel, config: BackendConfig):
    channel.exchange_declare(
        exchange=config.MESSAGING_EXCHANGE_JOBS,
        exchange_type='direct',
        durable=True
    )
    channel.queue_declare(
        queue=config.MESSAGING_QUEUE_JOBS,
        durable=True,
        arguments={'x-message-ttl': 60000}
    )
    channel.queue_bind(
        exchange=config.MESSAGING_EXCHANGE_JOBS,
        queue=config.MESSAGING_QUEUE_JOBS,
        routing_key='id'
    )
    amq_worker_declaration(channel, config)
