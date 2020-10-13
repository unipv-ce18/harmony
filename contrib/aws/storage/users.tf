resource "aws_iam_user" "st" {
  provider = aws.mgmt

  name = "hy-storage"
  path = "/harmony/"
}

resource "aws_iam_user_policy_attachment" "st_pa" {
  provider = aws.mgmt

  user       = aws_iam_user.st.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_access_key" "st_ak" {
  provider = aws.mgmt

  user = aws_iam_user.st.name
}
