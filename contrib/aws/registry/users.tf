resource "aws_iam_user" "re" {
  provider = aws.mgmt

  name = "hy-registry"
  path = "/harmony/"
}

resource "aws_iam_user_policy" "re_pa" {
  provider = aws.mgmt

  user   = aws_iam_user.re.name
  name   = "AssumeEducateEcrRole"
  policy = data.aws_iam_policy_document.ar_ecr_out.json
}

resource "aws_iam_access_key" "re_ak" {
  provider = aws.mgmt

  user = aws_iam_user.re.name
}


resource "aws_iam_role" "ecr_delegate" {
  name        = "HYDelegateEcr"
  description = "Full access to ECR for \"lczx-mgmt\""
  path        = "/harmony/"

  assume_role_policy = data.aws_iam_policy_document.ar_ecr_in.json
}

resource "aws_iam_role_policy_attachment" "ecr_delegate_pa" {
  role       = aws_iam_role.ecr_delegate.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess"
}


data "aws_iam_policy_document" "ar_ecr_out" {
  statement {
    effect    = "Allow"
    actions   = ["sts:AssumeRole"]
    resources = [aws_iam_role.ecr_delegate.arn]
  }
}

data "aws_iam_policy_document" "ar_ecr_in" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_user.re.arn]
    }
  }
}
