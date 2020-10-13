resource "aws_iam_user" "co" {
  provider = aws.mgmt

  name = "hy-compute"
  path = "/harmony/"
}

resource "aws_iam_user_policy" "co_pa" {
  provider = aws.mgmt

  user   = aws_iam_user.co.name
  name   = "AssumeEducateEcsRole"
  policy = data.aws_iam_policy_document.ar_ecs_out.json
}

resource "aws_iam_access_key" "co_ak" {
  provider = aws.mgmt

  user = aws_iam_user.co.name
}


resource "aws_iam_role" "ecs_delegate" {
  name        = "HyDelegateEcs"
  description = "Full access to ECS for \"lczx-mgmt\""
  path        = "/harmony/"

  assume_role_policy = data.aws_iam_policy_document.ar_ecs_in.json
}

resource "aws_iam_role_policy_attachment" "ecs_delegate_pa" {
  role       = aws_iam_role.ecs_delegate.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
}


data "aws_iam_policy_document" "ar_ecs_out" {
  statement {
    effect    = "Allow"
    actions   = ["sts:AssumeRole"]
    resources = [aws_iam_role.ecs_delegate.arn]
  }
}

data "aws_iam_policy_document" "ar_ecs_in" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_user.co.arn]
    }
  }
}
