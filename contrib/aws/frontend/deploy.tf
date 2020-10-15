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

resource "aws_s3_bucket_policy" "b" {
  bucket = aws_s3_bucket.b.id
  policy = data.aws_iam_policy_document.bp.json
}

data "aws_iam_policy_document" "bp" {
  statement {
    effect = "Allow"
    actions = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.b.arn}/*"]
    principals {
      type = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.webapp_s3.iam_arn]
    }
  }
}


locals {
  s3_origin_id = "S3-hy-webapp"
}

# Used by CloudFront to access the webapp bucket
resource "aws_cloudfront_origin_access_identity" "webapp_s3" {
  comment = "Webapp deploy access"
}

resource "aws_cloudfront_distribution" "webapp" {
  origin {
    domain_name = aws_s3_bucket.b.bucket_regional_domain_name
    origin_id   = local.s3_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.webapp_s3.cloudfront_access_identity_path
    }
  }

  enabled             = true
  comment             = "Harmony Webapp distribution"
  default_root_object = "index.html"

  aliases     = [var.site_name]
  price_class = "PriceClass_200"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  custom_error_response { # For (p)react router
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response { # For (p)react router
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  viewer_certificate {
    iam_certificate_id       = aws_iam_server_certificate.hy_cert.id
    minimum_protocol_version = "TLSv1.2_2019"
    ssl_support_method       = "sni-only"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

}
