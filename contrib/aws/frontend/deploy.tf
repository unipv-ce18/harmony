locals {
  s3_origin_id = "S3-hy-webapp"
}

resource "aws_iam_server_certificate" "hy_cert" {
  provider = aws.mgmt

  name = "HySiteCertificate"
  path = "/cloudfront/"  # Necessary for it to be used by CloudFront in frontend

  certificate_body  = file(var.cert_file)
  certificate_chain = file(var.cert_chain)
  private_key       = file(var.cert_key)
}

# Used by CloudFront to access the webapp bucket
resource "aws_cloudfront_origin_access_identity" "webapp_s3" {
  provider = aws.mgmt
  
  comment = "Webapp deploy access"
}

resource "aws_cloudfront_distribution" "webapp" {
  provider = aws.mgmt

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
