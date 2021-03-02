resource "aws_iam_policy" "ssm_params_allow" {
  name        = "HyReadParams"
  path        = "/harmony/"
  description = "Grants read permissions for Harmony task parameters"

  policy = data.aws_iam_policy_document.ssm_params_allow.json
}

data "aws_iam_policy_document" "ssm_params_allow" {
  statement {
    effect    = "Allow"
    actions   = ["ssm:GetParameters"]
    resources = ["arn:aws:ssm:${var.deploy_region}:${data.aws_caller_identity.current.account_id}:parameter/hy/*"]
  }
}


# Storage credentials

resource "aws_ssm_parameter" "s3_kid" {
  name  = "/hy/storage/kid"
  type  = "String"
  value = var.storage_access_key
}

resource "aws_ssm_parameter" "s3_key" {
  name  = "/hy/storage/key"
  type  = "String"
  value = var.storage_secret_key
}


# Compute credentials

resource "aws_ssm_parameter" "co_kid" {
  name  = "/hy/compute/kid"
  type  = "String"
  value = aws_iam_access_key.co_ak.id
}

resource "aws_ssm_parameter" "co_key" {
  name  = "/hy/compute/key"
  type  = "String"
  value = aws_iam_access_key.co_ak.secret
}

resource "aws_ssm_parameter" "co_role" {
  name  = "/hy/compute/role"
  type  = "String"
  value = aws_iam_role.ecs_delegate.arn
}


# Database credentials

resource "aws_ssm_parameter" "db_user" {
  name  = "/hy/db/user"
  type  = "String"
  value = var.db_user
}

resource "aws_ssm_parameter" "db_pass" {
  name  = "/hy/db/pass"
  type  = "String"
  value = var.db_pass
}


# Messaging credentials

resource "aws_ssm_parameter" "amqp_user" {
  name  = "/hy/amqp/user"
  type  = "String"
  value = var.amqp_user
}

resource "aws_ssm_parameter" "amqp_pass" {
  name  = "/hy/amqp/pass"
  type  = "String"
  value = var.amqp_pass
}


# Director configuration

resource "aws_ssm_parameter" "co_worker_cluster" {
  description = "Cluster used to spawn workers"
  name        = "/hy/compute/director/worker_cluster"
  type        = "String"
  value       = aws_ecs_cluster.hy.arn
}

resource "aws_ssm_parameter" "co_worker_subnets" {
  description = "Subnets in which new workers will be spawned"
  name        = "/hy/compute/director/worker_subnets"
  type        = "String"
  value       = aws_subnet.hy_private_1w.id
}

resource "aws_ssm_parameter" "co_worker_name" {
  description = "Name of worker container in worker task definition"
  name        = "/hy/compute/director/worker_task_container_name"
  type        = "String"
  value       = local.container_name_worker
}

resource "aws_ssm_parameter" "co_worker_td" {
  description = "Name of worker task definition to spawn"
  name        = "/hy/compute/director/worker_task_definition"
  type        = "String"
  value       = aws_ecs_task_definition.worker.arn
}
