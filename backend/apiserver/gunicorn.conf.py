# Configuration for containerized gunicorn

# Bind to port 80, any address
bind = ":80"

# Inside container we should redirect logs to stdout/stderr
accesslog = '-'
errorlog = '-'

# Heartbeat temporary files are better to be stored in tmpfs to avoid lag spikes while accessing physical storage,
# which may be up to 30s on AWS; /tmp is not tmpfs in Docker but /dev/shm is.
worker_tmp_dir = '/dev/shm'

# Ideally we should run a single worker per container and spin up multiple containers to use more cores,
# this is to allow us to process multiple requests using a single worker and avoid problems with heartbeat failing
# when we process slow requests
workers = 1
threads = 1
worker_class = 'eventlet'
