resource "aws_lb" "hy_api" {
  count = var.task_count_apiserver > 0 ? 1 : 0

  name = "hyapi-lb"
  security_groups = [
    aws_security_group.allow_http.id,
    aws_security_group.allow_https.id,
    aws_security_group.allow_all_outbound.id
  ]
  subnets = [
    aws_subnet.hy_public_1.id,
    aws_subnet.hy_public_2.id
  ]
}

resource "aws_lb_listener" "hy_api_fe_https" {
  count = var.task_count_apiserver > 0 ? 1 : 0

  load_balancer_arn = aws_lb.hy_api[0].arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_iam_server_certificate.hy_cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.hy_api_targets.arn
  }
}

resource "aws_lb_listener" "hy_api_fe_http" {
  count = var.task_count_apiserver > 0 ? 1 : 0

  load_balancer_arn = aws_lb.hy_api[0].arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_target_group" "hy_api_targets" {
  name        = "hyapi-lb-target"
  target_type = "ip"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.hy.id

  health_check {
    enabled             = true
    interval            = 300
    path                = "/api/v1/sayhello"
    timeout             = 60
    matcher             = "200"
    healthy_threshold   = 5
    unhealthy_threshold = 5
  }
}
