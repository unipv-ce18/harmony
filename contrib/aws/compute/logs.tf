resource "aws_cloudwatch_log_group" "apiserver" {
  name = "/ecs/hy-apiserver"
}

resource "aws_cloudwatch_log_group" "director" {
  name = "/ecs/hy-director"
}

resource "aws_cloudwatch_log_group" "worker" {
  name = "/ecs/hy-worker"
}
