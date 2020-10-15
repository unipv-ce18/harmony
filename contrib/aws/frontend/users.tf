resource "aws_iam_user" "de" {
  provider = aws.mgmt

  name = "hy-deploy"
  path = "/harmony/"
}

resource "aws_iam_user_policy_attachment" "de_pa" {
  provider = aws.mgmt

  user       = aws_iam_user.de.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_access_key" "de_ak" {
  provider = aws.mgmt

  user = aws_iam_user.de.name
}
