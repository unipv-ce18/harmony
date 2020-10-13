locals {
  container_name_apiserver = "apiserver-latest"
  container_name_director  = "director-latest"
  container_name_worker    = "worker-latest"
}

resource "aws_iam_role" "ecs_task_exec" {
  name               = "ecsTaskExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_exec_ar.json
}

data "aws_iam_policy_document" "ecs_task_exec_ar" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_exec_pa_ecs" {
  role       = aws_iam_role.ecs_task_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "ecs_task_exec_pa_hyssm" {
  role       = aws_iam_role.ecs_task_exec.name
  policy_arn = aws_iam_policy.ssm_params_allow.arn
}

resource "aws_ecs_cluster" "hy" {
  name               = "harmony"
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
}

resource "aws_ecs_service" "apiserver" {
  name            = "apiserver"
  cluster         = aws_ecs_cluster.hy.id
  task_definition = aws_ecs_task_definition.apiserver.arn
  desired_count   = var.task_count_apiserver
  launch_type     = "FARGATE"

  network_configuration {
    assign_public_ip = true
    security_groups = [
      aws_security_group.allow_http.id,
      aws_security_group.allow_all_outbound.id
    ]
    subnets = [
      aws_subnet.hy_public_1.id,
      aws_subnet.hy_public_2.id
    ]
  }

  load_balancer {
    container_name   = local.container_name_apiserver
    container_port   = 80
    target_group_arn = aws_lb_target_group.hy_api_targets.arn
  }
}

resource "aws_ecs_task_definition" "apiserver" {
  family = "hy-apiserver"
  container_definitions = templatefile("${path.module}/task-definitions/apiserver.json", {
    container_name = local.container_name_apiserver
  })

  cpu                      = "512"
  memory                   = "1024"
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_task_exec.arn
  requires_compatibilities = ["FARGATE"]
}

resource "aws_ecs_task_definition" "director" {
  family = "hy-director"
  container_definitions = templatefile("${path.module}/task-definitions/director.json", {
    container_name = local.container_name_director
  })

  cpu                      = "512"
  memory                   = "1024"
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_task_exec.arn
  requires_compatibilities = ["FARGATE"]
}

resource "aws_ecs_task_definition" "worker" {
  family = "hy-worker"
  container_definitions = templatefile("${path.module}/task-definitions/worker.json", {
    container_name = local.container_name_worker
  })

  cpu                      = "1024"
  memory                   = "2048"
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_task_exec.arn
  requires_compatibilities = ["FARGATE"]
}
