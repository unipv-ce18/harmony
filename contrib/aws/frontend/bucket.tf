resource "aws_iam_server_certificate" "hy_cert" {
  name = "HySiteCertificate"
  path = "/cloudfront/"

  certificate_body  = file(var.cert_file)
  certificate_chain = file(var.cert_chain)
  private_key       = file(var.cert_key)
}

resource "aws_s3_bucket" "b" {
  bucket = "hy-deploy-webapp"
  acl    = "private"

  website {
    index_document = "index.html"
    error_document = "index.html" # For (p)react router to work
  }
}

resource "aws_s3_bucket_public_access_block" "b" {
  bucket = aws_s3_bucket.b.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_ownership_controls" "b" {
  bucket = aws_s3_bucket.b.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_policy" "b" {
  bucket = aws_s3_bucket.b.id
  policy = data.aws_iam_policy_document.bp.json
}

data "aws_iam_policy_document" "bp" {
  statement {
    sid       = "cloudfront-access"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.b.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.webapp_s3.iam_arn]
    }
  }

  statement {
    sid    = "deploy-sync"
    effect = "Allow"
    actions = [
      "s3:DeleteObject",
      "s3:GetBucketLocation",
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.b.arn,
      "${aws_s3_bucket.b.arn}/*"
    ]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_user.de.arn]
    }
  }

  statement {
    sid       = "deploy-sync-put-as-owner"
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.b.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_user.de.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}
