resource "aws_lb" "hy_api" {
  name = "hyapi-lb"
  security_groups = [
    aws_security_group.allow_http.id,
    aws_security_group.allow_all_outbound.id
  ]
  subnets = [
    aws_subnet.hy_public_1.id,
    aws_subnet.hy_public_2.id
  ]
}

resource "aws_lb_listener" "hy_api_fe_http" {
  load_balancer_arn = aws_lb.hy_api.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.hy_api_targets.arn
  }
}

resource "aws_lb_target_group" "hy_api_targets" {
  name        = "hyapi-lb-target"
  target_type = "ip"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.hy.id
}
